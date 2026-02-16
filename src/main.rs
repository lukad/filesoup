mod id;
mod static_files;

use std::{collections::HashMap, net::SocketAddr, sync::Arc, time::Duration};

use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tokio::{
    sync::Mutex,
    time::{self, Instant},
};
use tower_http::trace::{self, TraceLayer};
use tracing::{info, Level};
use tracing_subscriber::EnvFilter;

use crate::static_files::static_handler;

// Cleanup interval for expired files (runs every 10 seconds)
const CLEANUP_INTERVAL_SECS: u64 = 10;
// Maximum time a file is kept before expiration (10 minutes)
const FILE_MAX_AGE_MINS: u64 = 10;

type Files = Arc<Mutex<HashMap<String, File>>>;

async fn index() -> impl IntoResponse {
    static_handler(Path("index.html".to_string())).await
}

async fn health() -> StatusCode {
    StatusCode::OK
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
struct NewFile {
    magnet_uri: String,
}

fn is_valid_magnet_uri(uri: &str) -> bool {
    // Must start with magnet:
    if !uri.starts_with("magnet:") {
        return false;
    }
    // Must contain xt parameter (info hash)
    if !uri.contains("xt=") {
        return false;
    }
    // Basic length check (prevent absurdly long URIs)
    if uri.len() > 10000 {
        return false;
    }
    true
}

async fn get_file(
    State(files): State<Files>,
    Path(id): Path<String>,
) -> Result<Json<File>, StatusCode> {
    let mut files = files.lock().await;
    let file = files.get_mut(&id).ok_or(StatusCode::NOT_FOUND)?;
    file.last_accessed = Some(Instant::now());
    Ok(Json(file.clone()))
}

async fn add_file(
    State(files): State<Files>,
    Json(new_file): Json<NewFile>,
) -> Result<Json<File>, StatusCode> {
    if !is_valid_magnet_uri(&new_file.magnet_uri) {
        return Err(StatusCode::BAD_REQUEST);
    }

    let file = File {
        id: id::id(5, "-"),
        magnet_uri: new_file.magnet_uri.to_string(),
        inserted_at: Instant::now(),
        last_accessed: None,
    };

    let json = Json(file.clone());
    files.lock().await.insert(file.id.clone(), file);
    Ok(json)
}

async fn cleanup_old_files(files: Files) {
    let mut interval = time::interval(Duration::from_secs(CLEANUP_INTERVAL_SECS));
    let max_age = Duration::from_mins(FILE_MAX_AGE_MINS);
    loop {
        interval.tick().await;
        let mut files = files.lock().await;
        let now = Instant::now();
        files.retain(|_id, file| {
            let instant = file.last_accessed.unwrap_or(file.inserted_at);
            now.duration_since(instant) < max_age
        });
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .or_else(|_| EnvFilter::try_new("info"))
                .unwrap(),
        )
        .init();

    let files = Files::default();
    tokio::spawn(cleanup_old_files(files.clone()));

    let app = Router::new()
        .route("/", get(index))
        .route("/health", get(health))
        .route("/files/{id}", get(get_file))
        .route("/files", post(add_file))
        .route("/{*path}", get(static_handler))
        .with_state(files)
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(trace::DefaultMakeSpan::new().level(Level::INFO))
                .on_response(trace::DefaultOnResponse::new().level(Level::INFO)),
        );

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .expect("Failed to bind address");

    info!("Listening on: http://{}", addr);

    axum::serve(listener, app).await.expect("Server error");
}
