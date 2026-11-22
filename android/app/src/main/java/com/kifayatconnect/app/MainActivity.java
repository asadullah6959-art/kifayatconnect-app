package com.kifayatconnect.app;

import android.Manifest;
import android.content.ActivityNotFoundException;
import android.content.Context;
import android.content.Intent;
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
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    private static final String LATEST_APK_DOWNLOAD_URL =
        "https://github.com/asadullah6959-art/kifayatconnect-app/releases/latest/download/SUI-KHEL-ITTEHAD.apk";
    private static final int REQ_WEB_MEDIA = 4001;
    private static final int REQ_GALLERY_MEDIA = 4002;

    private PermissionRequest pendingPermissionRequest;
    private WebView pendingFileWebView;
    private ValueCallback<Uri[]> pendingFilePathCallback;
    private WebChromeClient.FileChooserParams pendingFileChooserParams;
    private SKIWebChromeClient customChromeClient;

    private ArrayList<String> getRequiredMediaPermissions(PermissionRequest request) {
        ArrayList<String> required = new ArrayList<>();
        String[] resources = request.getResources();
        if (resources == null) return required;

        for (String resource : resources) {
            String permission = null;
            if (PermissionRequest.RESOURCE_VIDEO_CAPTURE.equals(resource)) {
                permission = Manifest.permission.CAMERA;
            } else if (PermissionRequest.RESOURCE_AUDIO_CAPTURE.equals(resource)) {
                permission = Manifest.permission.RECORD_AUDIO;
            }
            if (permission != null && !required.contains(permission)) {
                required.add(permission);
            }
        }
        return required;
    }

    private String[] getMissingMediaPermissions(PermissionRequest request) {
        ArrayList<String> missing = new ArrayList<>();
        for (String permission : getRequiredMediaPermissions(request)) {
            if (ContextCompat.checkSelfPermission(this, permission) != PackageManager.PERMISSION_GRANTED) {
                missing.add(permission);
            }
        }
        return missing.toArray(new String[0]);
    }

    private class SKIWebChromeClient extends BridgeWebChromeClient {
        SKIWebChromeClient() {
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
            String[] missingPermissions = getMissingMediaPermissions(request);
            if (missingPermissions.length > 0) {
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
                        missingPermissions,
                        REQ_WEB_MEDIA
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

    private class SKIOtaBridge {
        @JavascriptInterface
        public void clearWebViewHttpCache() {
            runOnUiThread(() -> {
                if (bridge != null && bridge.getWebView() != null) {
                    // Clears ONLY HTTP disk cache (JS/CSS/HTML), leaving localStorage & IndexedDB auth sessions untouched
                    bridge.getWebView().clearCache(false);
                }
            });
        }

        @JavascriptInterface
        public void openExternalUrl(String url) {
            if (!LATEST_APK_DOWNLOAD_URL.equals(url)) return;
            Uri uri = Uri.parse(LATEST_APK_DOWNLOAD_URL);
            Intent intent = new Intent(Intent.ACTION_VIEW, uri);
            intent.addCategory(Intent.CATEGORY_BROWSABLE);
            runOnUiThread(() -> {
                try {
                    startActivity(intent);
                } catch (ActivityNotFoundException e) {
                    Toast.makeText(
                        MainActivity.this,
                        "No browser is available to download the APK.",
                        Toast.LENGTH_LONG
                    ).show();
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
            webView.addJavascriptInterface(new SKIOtaBridge(), "SKIOtaNative");
            if (customChromeClient == null) {
                customChromeClient = new SKIWebChromeClient();
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

        if (requestCode == REQ_WEB_MEDIA && pendingPermissionRequest != null) {
            final PermissionRequest req = pendingPermissionRequest;
            pendingPermissionRequest = null;
            final boolean granted = getMissingMediaPermissions(req).length == 0;
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
