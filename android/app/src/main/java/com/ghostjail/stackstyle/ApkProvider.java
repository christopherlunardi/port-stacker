package com.ghostjail.stackstyle;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import java.io.File;
import java.io.FileNotFoundException;

// Hands the downloaded app update to Android's installer (it can't read our private files directly). Serves only update.apk.
public class ApkProvider extends ContentProvider {
  static final String AUTH = "com.ghostjail.stackstyle.apk";
  static Uri uri() { return Uri.parse("content://" + AUTH + "/update.apk"); }
  @Override public boolean onCreate() { return true; }
  @Override public ParcelFileDescriptor openFile(Uri u, String mode) throws FileNotFoundException {
    File f = new File(getContext().getCacheDir(), "update.apk");
    if (!"update.apk".equals(u.getLastPathSegment()) || !f.exists()) throw new FileNotFoundException();
    return ParcelFileDescriptor.open(f, ParcelFileDescriptor.MODE_READ_ONLY);
  }
  @Override public String getType(Uri u) { return "application/vnd.android.package-archive"; }
  @Override public Cursor query(Uri u, String[] p, String s, String[] a, String o) { return null; }
  @Override public Uri insert(Uri u, ContentValues v) { return null; }
  @Override public int delete(Uri u, String s, String[] a) { return 0; }
  @Override public int update(Uri u, ContentValues v, String s, String[] a) { return 0; }
}
