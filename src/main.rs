#[macro_use]
extern crate rocket;

mod id;

use std::{
    borrow::Cow,
    collections::HashMap,
    env,
    ffi::OsStr,
    path::PathBuf,
    sync::{Arc, Mutex},
    time::Duration,
};

use rocket::{
    fairing::{self, Fairing},
    http::{ContentType, Status},
    serde::{json::Json, Serialize},
    shield::{ExpectCt, Hsts, Shield},
    tokio::{
        self,
        time::{self, Instant},
    },
    Build, Response, Rocket, State,
};
use rust_embed::RustEmbed;
use serde::Deserialize;

#[derive(RustEmbed)]
#[folder = "frontend/dist"]
struct Assets;

type Files = Arc<Mutex<HashMap<String, File>>>;

#[get("/")]
fn index() -> Option<(ContentType, Cow<'static, [u8]>)> {
    let asset = Assets::get("index.html")?;
    Some((ContentType::HTML, asset.data))
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
fn get_file(files: &State<Files>, id: &str) -> Option<Json<File>> {
    files.lock().expect("msg").get_mut(id).map(|file| {
        file.last_accessed = Some(Instant::now());
        Json(file.clone())
    })
}

#[post("/files", format = "json", data = "<new_file>")]
fn add_file<'r>(files: &State<Files>, new_file: Json<NewFile<'r>>) -> Json<File> {
    let file = File {
        id: id::id(5, "-"),
        magnet_uri: new_file.magnet_uri.to_string(),
        inserted_at: Instant::now(),
        last_accessed: None,
    };
    let json = Json(file.clone());
    let mut files = files.lock().unwrap();
    files.insert(file.id.clone(), file);
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
fn rocket() -> _ {
    let files = Files::default();
    let files_clone = files.clone();

    tokio::spawn(async move {
        let mut interval = time::interval(Duration::from_secs(10));
        let max_age = Duration::from_secs(60 * 10);
        loop {
            interval.tick().await;
            let mut files = files_clone.lock().unwrap();
            let now = Instant::now();
            files.retain(|_id, file| {
                let instant = file.last_accessed.unwrap_or(file.inserted_at);
                now.duration_since(instant) < max_age
            });
        }
    });

    let hsts_enabled = env::var("HSTS_ENABLED").is_ok();

    let mut shield = Shield::default();
    if hsts_enabled {
        shield = shield
            .enable(Hsts::Preload(rocket::time::Duration::days(365)))
            .enable(ExpectCt::default());
    }

    let redirect_to_https = fairing::AdHoc::on_response("Redirect to https", |req, resp| {
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
                                .unwrap_or("filesoup.io".to_string()),
                            req.uri().to_string()
                        ),
                    )
                    .finalize();
            }
        })
    });

    rocket::build()
        .manage(files)
        .attach(shield)
        .attach_if(hsts_enabled, redirect_to_https)
        .mount("/", routes![index, get_file, add_file, assets])
}
