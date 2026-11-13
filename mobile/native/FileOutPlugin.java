package org.waqf.maktabasunnah;

import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.provider.MediaStore;
import android.util.Base64;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/** حفظ الملفات في مجلد التنزيلات ومشاركتها، والطباعة/الحفظ PDF عبر خدمة الطباعة في أندرويد */
@CapacitorPlugin(name = "FileOut")
public class FileOutPlugin extends Plugin {
    private WebView printView; // يبقى مرجعه حتى تنتهي الطباعة

    @PluginMethod
    public void save(PluginCall call) {
        String name = call.getString("name", "file");
        String mime = call.getString("mime", "application/octet-stream");
        String data = call.getString("data", "");
        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            JSObject r = new JSObject();
            if (Build.VERSION.SDK_INT >= 29) {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Downloads.DISPLAY_NAME, name);
                cv.put(MediaStore.Downloads.MIME_TYPE, mime);
                cv.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Maktaba");
                Uri uri = getContext().getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                if (uri == null) throw new Exception("insert failed");
                OutputStream os = getContext().getContentResolver().openOutputStream(uri);
                if (os == null) throw new Exception("open failed");
                os.write(bytes); os.close();
                r.put("uri", uri.toString());
                r.put("path", "Download/Maktaba/" + name);
            } else {
                File dir = getContext().getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS);
                File f = new File(dir, name);
                FileOutputStream fo = new FileOutputStream(f); fo.write(bytes); fo.close();
                r.put("uri", "");
                r.put("path", f.getAbsolutePath());
            }
            call.resolve(r);
        } catch (Exception e) {
            call.reject("تعذر حفظ الملف: " + e.getMessage());
        }
    }

    @PluginMethod
    public void share(PluginCall call) {
        String uri = call.getString("uri", "");
        String mime = call.getString("mime", "*/*");
        String title = call.getString("title", "مشاركة");
        if (uri.isEmpty()) { call.reject("no uri"); return; }
        try {
            Intent i = new Intent(Intent.ACTION_SEND);
            i.setType(mime);
            i.putExtra(Intent.EXTRA_STREAM, Uri.parse(uri));
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            Intent ch = Intent.createChooser(i, title);
            ch.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            getActivity().startActivity(ch);
            call.resolve();
        } catch (Exception e) { call.reject(e.getMessage()); }
    }

    @PluginMethod
    public void open(PluginCall call) {
        String uri = call.getString("uri", "");
        String mime = call.getString("mime", "*/*");
        try {
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(Uri.parse(uri), mime);
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getActivity().startActivity(i);
            call.resolve();
        } catch (Exception e) { call.reject("لا يوجد تطبيق يفتح هذا الملف"); }
    }

    /** يفتح شاشة الطباعة في أندرويد، ومنها «حفظ بتنسيق PDF» */
    @PluginMethod
    public void print(PluginCall call) {
        final String html = call.getString("html", "");
        final String name = call.getString("name", "document");
        getActivity().runOnUiThread(() -> {
            try {
                final WebView w = new WebView(getActivity());
                printView = w;
                final boolean[] done = { false };
                w.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView v, String url) {
                        if (done[0]) return;
                        done[0] = true;
                        PrintManager pm = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                        PrintDocumentAdapter ad = v.createPrintDocumentAdapter(name);
                        pm.print(name, ad, new PrintAttributes.Builder().setMediaSize(PrintAttributes.MediaSize.ISO_A4).build());
                        call.resolve();
                    }
                });
                w.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
            } catch (Exception e) { call.reject(e.getMessage()); }
        });
    }
}
