#[macro_use]
extern crate rocket;

mod id;

use std::{
    borrow::Cow,
    collections::HashMap,
    ffi::OsStr,
    path::PathBuf,
    sync::{Arc, Mutex},
    time::Duration,
};

use rocket::{
    http::ContentType,
    response::content::Html,
    serde::{json::Json, Serialize},
    tokio::{
        self,
        time::{self, Instant},
    },
    State,
};
use rust_embed::RustEmbed;
use serde::Deserialize;

#[derive(RustEmbed)]
#[folder = "frontend/dist"]
struct Assets;

type Files = Arc<Mutex<HashMap<String, File>>>;

#[get("/")]
fn index() -> Option<Html<Cow<'static, [u8]>>> {
    let asset = Assets::get("index.html")?;
    Some(Html(asset.data))
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
    rocket::build()
        .manage(files)
        .mount("/", routes![index, get_file, add_file, assets])
}
