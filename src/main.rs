#[macro_use]
extern crate rocket;

mod id;

use std::{
    borrow::Cow, collections::HashMap, env, ffi::OsStr, path::PathBuf, sync::Arc, time::Duration,
};

use rocket::{
    config::Config,
    data::{ByteUnit, Limits},
    fairing::{self, Fairing},
    http::{ContentType, Status},
    serde::{json::Json, Serialize},
    shield::{ExpectCt, Hsts, Shield},
    tokio::{
        self,
        sync::Mutex,
        time::{self, Instant},
    },
    Build, Response, Rocket, State,
};
use rust_embed::RustEmbed;
use serde::Deserialize;

// Cleanup interval for expired files (runs every 10 seconds)
const CLEANUP_INTERVAL_SECS: u64 = 10;
// Maximum time a file is kept before expiration (10 minutes)
const FILE_MAX_AGE_MINS: u64 = 10;

#[derive(RustEmbed)]
#[folder = "frontend/dist"]
struct Assets;

type Files = Arc<Mutex<HashMap<String, File>>>;

#[get("/")]
fn index() -> Option<(ContentType, Cow<'static, [u8]>)> {
    let asset = Assets::get("index.html")?;
    Some((ContentType::HTML, asset.data))
}

#[get("/health")]
fn health() -> Status {
    Status::Ok
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct File {
    id: String,
    magnet_uri: String,
    #[serde(skip)]
    inserted_at: Instant,
    #[serde(skip)]
    last_accessed: Option<Instant>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct NewFile<'r> {
    magnet_uri: &'r str,
}

#[get("/files/<id>")]
async fn get_file(files: &State<Files>, id: &str) -> Option<Json<File>> {
    files.lock().await.get_mut(id).map(|file| {
        file.last_accessed = Some(Instant::now());
        Json(file.clone())
    })
}

#[post("/files", format = "json", data = "<new_file>")]
async fn add_file(files: &State<Files>, new_file: Json<NewFile<'_>>) -> Json<File> {
    let file = File {
        id: id::id(5, "-"),
        magnet_uri: new_file.magnet_uri.to_string(),
        inserted_at: Instant::now(),
        last_accessed: None,
    };
    let json = Json(file.clone());
    files.lock().await.insert(file.id.clone(), file);
    json
}

#[get("/<file..>")]
fn assets(file: PathBuf) -> Option<(ContentType, Cow<'static, [u8]>)> {
    let filename = file.display().to_string();

    match Assets::get(&filename) {
        Some(asset) => {
            let content_type = file
                .extension()
                .and_then(OsStr::to_str)
                .and_then(ContentType::from_extension)
                .unwrap_or(ContentType::Bytes);

            Some((content_type, asset.data))
        }
        None => {
            let index = Assets::get("index.html")?;
            Some((ContentType::HTML, index.data))
        }
    }
}

pub trait ConditionalAttach {
    fn attach_if(self, condition: bool, fairing: impl Fairing) -> Self;
}

impl ConditionalAttach for Rocket<Build> {
    #[inline]
    fn attach_if(self, condition: bool, fairing: impl Fairing) -> Self {
        if condition {
            self.attach(fairing)
        } else {
            self
        }
    }
}

#[launch]
#[tokio::main]
async fn rocket() -> _ {
    let files = Files::default();
    let files_clone = files.clone();

    tokio::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(CLEANUP_INTERVAL_SECS));
        let max_age = Duration::from_secs(FILE_MAX_AGE_MINS * 60);
        loop {
            interval.tick().await;
            let mut files = files_clone.lock().await;
            let now = Instant::now();
            files.retain(|_id, file| {
                let instant = file.last_accessed.unwrap_or(file.inserted_at);
                now.duration_since(instant) < max_age
            });
        }
    });

    let hsts_enabled = env::var("HSTS_ENABLED").is_ok();
    let default_domain: String = env::var("APP_DOMAIN")
        .unwrap_or_else(|_| "filesoup.io".to_string());

    let mut shield = Shield::default();
    if hsts_enabled {
        shield = shield
            .enable(Hsts::Preload(rocket::time::Duration::days(365)))
            .enable(ExpectCt::default());
    }

    let redirect_to_https = fairing::AdHoc::on_response("Redirect to https", move |req, resp| {
        let domain = default_domain.clone();
        Box::pin(async move {
            if req.headers().get("X-Forwarded-Proto").any(|x| x == "http") {
                *resp = Response::build()
                    .status(Status::MovedPermanently)
                    .raw_header(
                        "Location",
                        format!(
                            "https://{}{}",
                            req.host()
                                .map(|host| host.to_string())
                                .unwrap_or_else(|| domain),
                            req.uri()
                        ),
                    )
                    .finalize();
            }
        })
    });

    rocket::build()
        .manage(files)
        .configure(
            Config::figment()
                .merge(("limits", Limits::default().limit("json", ByteUnit::Byte(8 * 1024)))),
        )
        .attach(shield)
        .attach_if(hsts_enabled, redirect_to_https)
        .mount("/", routes![index, health, get_file, add_file, assets])
}
