export default function SendMessageToDotnet(msg) {
  if (typeof window === "undefined") {
    return false;
  }

  if (window.chrome?.webview?.postMessage) {
    window.chrome.webview.postMessage(msg);
    return true;
  }

  if (window.ReactNativeWebView?.postMessage) {
    window.ReactNativeWebView.postMessage(msg);
    return true;
  }

  console.info("Dotnet bridge unavailable; skipped message:", msg);
  return false;
}
