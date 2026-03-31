use parking_lot::Mutex;
use std::net::{TcpListener, TcpStream};
use std::path::{Path, PathBuf};
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, LazyLock};
use std::thread;
use std::time::{Duration, Instant};

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[cfg(target_os = "windows")]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[derive(Clone, Default)]
pub struct FrontendRuntimeState {
    child: Arc<Mutex<Option<Child>>>,
}

impl FrontendRuntimeState {
    pub fn replace(&self, child: Child) {
        self.stop();
        *self.child.lock() = Some(child);
    }

    pub fn stop(&self) {
        let mut guard = self.child.lock();
        if let Some(mut child) = guard.take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

pub fn start_embedded_frontend(resource_dir: &Path) -> Result<String, String> {
    let runtime_dir = resource_dir.join("frontend-prod");
    let node_path = resolve_node_path(&runtime_dir)?;
    let server_entry = runtime_dir.join("standalone").join("server.js");
    if !server_entry.exists() {
        return Err(format!(
            "Next standalone server entry not found: {}",
            server_entry.display()
        ));
    }

    let port = pick_available_port()?;
    let server_root = server_entry
        .parent()
        .ok_or_else(|| "invalid standalone server path".to_string())?;

    let mut command = Command::new(node_path);
    command
        .arg(&server_entry)
        .current_dir(server_root)
        .env("NODE_ENV", "production")
        .env("PORT", port.to_string())
        .env("HOSTNAME", "127.0.0.1")
        .stdout(Stdio::null())
        .stderr(Stdio::null());

    #[cfg(target_os = "windows")]
    command.creation_flags(CREATE_NO_WINDOW);

    let child = command
        .spawn()
        .map_err(|error| format!("failed to start embedded Next runtime: {error}"))?;

    let address = format!("http://127.0.0.1:{port}");
    wait_until_ready(&address, Duration::from_secs(20))?;

    FRONTEND_RUNTIME.replace(child);
    Ok(address)
}

pub fn stop_embedded_frontend() {
    FRONTEND_RUNTIME.stop();
}

fn resolve_node_path(runtime_dir: &Path) -> Result<PathBuf, String> {
    let candidates = if cfg!(target_os = "windows") {
        vec![runtime_dir.join("node").join("node.exe")]
    } else {
        vec![runtime_dir.join("node").join("node")]
    };

    candidates
        .into_iter()
        .find(|path| path.exists())
        .ok_or_else(|| format!("bundled Node runtime not found under {}", runtime_dir.display()))
}

fn pick_available_port() -> Result<u16, String> {
    TcpListener::bind("127.0.0.1:0")
        .map_err(|error| format!("failed to reserve a localhost port: {error}"))?
        .local_addr()
        .map(|addr| addr.port())
        .map_err(|error| format!("failed to read reserved localhost port: {error}"))
}

fn wait_until_ready(base_url: &str, timeout: Duration) -> Result<(), String> {
    let socket = base_url.trim_start_matches("http://");
    let deadline = Instant::now() + timeout;

    while Instant::now() < deadline {
        if TcpStream::connect(socket).is_ok() {
            return Ok(());
        }
        thread::sleep(Duration::from_millis(150));
    }

    Err(format!("embedded Next runtime did not start before timeout at {base_url}"))
}

static FRONTEND_RUNTIME: LazyLock<FrontendRuntimeState> =
    LazyLock::new(FrontendRuntimeState::default);
