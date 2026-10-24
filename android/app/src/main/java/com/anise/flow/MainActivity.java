package com.anise.flow;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final String WEB_APP_URL = "https://anise-flow.bnonlyuser-01c.workers.dev/";
    private static final String ACTION_ADD_DOCTOR = "com.anise.flow.ACTION_ADD_DOCTOR";

    private WebView webView;
    private View errorView;
    private boolean pendingAddDoctor = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window window = getWindow();
        window.setStatusBarColor(Color.rgb(11, 13, 15));
        window.setNavigationBarColor(Color.rgb(11, 13, 15));
        window.setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        window.setDecorFitsSystemWindows(true);

        pendingAddDoctor = ACTION_ADD_DOCTOR.equals(getIntent().getAction())
                || "add_doctor".equals(getIntent().getStringExtra("widget_action"));

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(11, 13, 15));
        root.setFitsSystemWindows(true);

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(11, 13, 15));
        webView.setVerticalScrollBarEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }

            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                showWebView();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (pendingAddDoctor) {
                    openAddDoctorFromWidget();
                }
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showError();
                }
            }
        });

        root.addView(webView, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f
        ));

        errorView = createErrorView();
        errorView.setVisibility(View.GONE);
        root.addView(errorView, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                0,
                1f
        ));

        setContentView(root);
        webView.loadUrl(WEB_APP_URL);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (ACTION_ADD_DOCTOR.equals(intent.getAction())
                || "add_doctor".equals(intent.getStringExtra("widget_action"))) {
            pendingAddDoctor = true;
            if (webView != null) {
                openAddDoctorFromWidget();
            }
        }
    }

    private void openAddDoctorFromWidget() {
        if (webView == null) return;
        webView.evaluateJavascript(
                "(function(){" +
                "function find(){" +
                "var els=Array.prototype.slice.call(document.querySelectorAll('button'));" +
                "var el=els.find(function(b){return (b.innerText||'').trim().toLowerCase()==='add doctor';});" +
                "if(el){el.click();return true;}return false;}" +
                "if(find()){return;}" +
                "if(window.__aniseWidgetObserver){window.__aniseWidgetObserver.disconnect();}" +
                "window.__aniseWidgetObserver=new MutationObserver(function(){if(find()){window.__aniseWidgetObserver.disconnect();}});" +
                "if(document.body){window.__aniseWidgetObserver.observe(document.body,{childList:true,subtree:true});}" +
                "setTimeout(function(){if(window.__aniseWidgetObserver){window.__aniseWidgetObserver.disconnect();}},30000);" +
                "})()",
                value -> pendingAddDoctor = false
        );
    }

    private View createErrorView() {
        LinearLayout panel = new LinearLayout(this);
        panel.setOrientation(LinearLayout.VERTICAL);
        panel.setGravity(Gravity.CENTER);
        panel.setPadding(48, 48, 48, 48);
        panel.setBackgroundColor(Color.rgb(11, 13, 15));

        TextView title = new TextView(this);
        title.setText("ANISE Flow");
        title.setTextColor(Color.WHITE);
        title.setTextSize(22);
        title.setGravity(Gravity.CENTER);

        TextView message = new TextView(this);
        message.setText("The app could not reach the ANISE Flow server.\n\nCheck your internet connection and try again.");
        message.setTextColor(Color.rgb(190, 194, 198));
        message.setTextSize(15);
        message.setGravity(Gravity.CENTER);
        message.setPadding(0, 20, 0, 24);

        Button retry = new Button(this);
        retry.setText("Retry");
        retry.setOnClickListener(v -> {
            showWebView();
            webView.loadUrl(WEB_APP_URL);
        });

        panel.addView(title);
        panel.addView(message);
        panel.addView(retry);
        return panel;
    }

    private void showError() {
        webView.setVisibility(View.GONE);
        errorView.setVisibility(View.VISIBLE);
    }

    private void showWebView() {
        errorView.setVisibility(View.GONE);
        webView.setVisibility(View.VISIBLE);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
