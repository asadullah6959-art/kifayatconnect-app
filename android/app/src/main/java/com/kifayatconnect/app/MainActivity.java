package com.kifayatconnect.app;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.net.Uri;
import android.os.Build;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    private static final int REQ_RECORD_AUDIO = 4001;
    private static final int REQ_GALLERY_MEDIA = 4002;

    private PermissionRequest pendingPermissionRequest;
    private WebView pendingFileWebView;
    private ValueCallback<Uri[]> pendingFilePathCallback;
    private WebChromeClient.FileChooserParams pendingFileChooserParams;
    private KifayatWebChromeClient customChromeClient;

    private class KifayatWebChromeClient extends BridgeWebChromeClient {
        KifayatWebChromeClient() {
            super(MainActivity.this.bridge);
        }

        boolean invokeSuperShowFileChooser(
            WebView webView,
            ValueCallback<Uri[]> filePathCallback,
            FileChooserParams fileChooserParams
        ) {
            return super.onShowFileChooser(webView, filePathCallback, fileChooserParams);
        }

        @Override
        public void onPermissionRequest(final PermissionRequest request) {
            if (request == null) return;
            boolean wantsAudio = false;
            String[] resources = request.getResources();
            if (resources != null) {
                for (String res : resources) {
                    if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(res)) {
                        wantsAudio = true;
                        break;
                    }
                }
            }

            if (wantsAudio && ContextCompat.checkSelfPermission(
                    MainActivity.this,
                    Manifest.permission.RECORD_AUDIO
                ) != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread(() -> {
                    if (pendingPermissionRequest != null && pendingPermissionRequest != request) {
                        try {
                            pendingPermissionRequest.deny();
                        } catch (Exception ignored) {
                        }
                    }
                    pendingPermissionRequest = request;
                    ActivityCompat.requestPermissions(
                        MainActivity.this,
                        new String[]{ Manifest.permission.RECORD_AUDIO },
                        REQ_RECORD_AUDIO
                    );
                });
                return;
            }

            runOnUiThread(() -> {
                try {
                    request.grant(request.getResources());
                } catch (Exception ignored) {
                }
            });
        }

        @Override
        public void onPermissionRequestCanceled(final PermissionRequest request) {
            runOnUiThread(() -> {
                if (pendingPermissionRequest == request) {
                    pendingPermissionRequest = null;
                }
            });
            super.onPermissionRequestCanceled(request);
        }

        @Override
        public boolean onShowFileChooser(
            WebView webView,
            ValueCallback<Uri[]> filePathCallback,
            FileChooserParams fileChooserParams
        ) {
            String requiredPerm = Build.VERSION.SDK_INT >= 33
                ? Manifest.permission.READ_MEDIA_IMAGES
                : Manifest.permission.READ_EXTERNAL_STORAGE;

            if (ContextCompat.checkSelfPermission(MainActivity.this, requiredPerm)
                    != PackageManager.PERMISSION_GRANTED) {
                if (pendingFilePathCallback != null) {
                    try {
                        pendingFilePathCallback.onReceiveValue(null);
                    } catch (Exception ignored) {
                    }
                }
                pendingFileWebView = webView;
                pendingFilePathCallback = filePathCallback;
                pendingFileChooserParams = fileChooserParams;
                ActivityCompat.requestPermissions(
                    MainActivity.this,
                    new String[]{ requiredPerm },
                    REQ_GALLERY_MEDIA
                );
                return true;
            }

            return super.onShowFileChooser(webView, filePathCallback, fileChooserParams);
        }
    }

    private boolean isNetworkAvailable() {
        try {
            ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
            if (cm == null) return true;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                android.net.Network activeNetwork = cm.getActiveNetwork();
                if (activeNetwork == null) return false;
                NetworkCapabilities caps = cm.getNetworkCapabilities(activeNetwork);
                return caps != null && (
                    caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                    caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR) ||
                    caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)
                );
            }
            return true;
        } catch (Exception ignored) {
            return true;
        }
    }

    private class KifayatOtaBridge {
        @JavascriptInterface
        public void clearWebViewHttpCache() {
            runOnUiThread(() -> {
                if (bridge != null && bridge.getWebView() != null) {
                    // Clears ONLY HTTP disk cache (JS/CSS/HTML), leaving localStorage & IndexedDB auth sessions untouched
                    bridge.getWebView().clearCache(false);
                }
            });
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        if (this.bridge != null && this.bridge.getWebView() != null) {
            WebView webView = this.bridge.getWebView();
            WebSettings settings = webView.getSettings();
            if (settings != null) {
                settings.setCacheMode(
                    isNetworkAvailable()
                        ? WebSettings.LOAD_NO_CACHE
                        : WebSettings.LOAD_CACHE_ELSE_NETWORK
                );
            }
            webView.addJavascriptInterface(new KifayatOtaBridge(), "KifayatOtaNative");
            if (customChromeClient == null) {
                customChromeClient = new KifayatWebChromeClient();
            }
            webView.setWebChromeClient(customChromeClient);
        }
    }

    @Override
    public void onRequestPermissionsResult(
        int requestCode,
        @NonNull String[] permissions,
        @NonNull int[] grantResults
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);

        if (requestCode == REQ_RECORD_AUDIO && pendingPermissionRequest != null) {
            final PermissionRequest req = pendingPermissionRequest;
            pendingPermissionRequest = null;
            final boolean granted = grantResults.length > 0
                && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            runOnUiThread(() -> {
                try {
                    if (granted) {
                        req.grant(req.getResources());
                    } else {
                        req.deny();
                    }
                } catch (Exception ignored) {
                }
            });
            return;
        }

        if (requestCode == REQ_GALLERY_MEDIA && pendingFilePathCallback != null) {
            final WebView wv = pendingFileWebView;
            final ValueCallback<Uri[]> cb = pendingFilePathCallback;
            final WebChromeClient.FileChooserParams params = pendingFileChooserParams;
            pendingFileWebView = null;
            pendingFilePathCallback = null;
            pendingFileChooserParams = null;

            runOnUiThread(() -> {
                boolean started = false;
                try {
                    if (customChromeClient != null) {
                        started = customChromeClient.invokeSuperShowFileChooser(wv, cb, params);
                    }
                } catch (Exception ignored) {
                }
                if (!started) {
                    try {
                        cb.onReceiveValue(null);
                    } catch (Exception ignored) {
                    }
                }
            });
        }
    }
}
