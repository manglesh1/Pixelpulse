export default function SendMessageToDotnet(msg) {
  const payload = { value: msg };

  window.chrome.webview.postMessage(msg);

  // // Prefer invokeCSharpAction/chrome.webview if present; fallback to custom URL
  // if (typeof window !== 'undefined') {
  //   if (window.invokeCSharpAction) {
  //     window.invokeCSharpAction(JSON.stringify(payload));
  //   } else if (window.chrome?.webview?.postMessage) {
  //     window.chrome.webview.postMessage(JSON.stringify(payload));
  //   } else {
  //     window.location.href = 'app://send?' + encodeURIComponent(JSON.stringify(payload));
  //   }
  // }
}
