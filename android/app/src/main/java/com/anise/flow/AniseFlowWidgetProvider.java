package com.anise.flow;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.widget.RemoteViews;

public class AniseFlowWidgetProvider extends AppWidgetProvider {
    private static final String ACTION_ADD_DOCTOR = "com.anise.flow.ACTION_ADD_DOCTOR";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_anise_flow);

            Intent addIntent = new Intent(context, MainActivity.class);
            addIntent.setAction(ACTION_ADD_DOCTOR);
            addIntent.putExtra("widget_action", "add_doctor");
            addIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent addPendingIntent = PendingIntent.getActivity(
                    context,
                    1001,
                    addIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            Intent openIntent = new Intent(context, MainActivity.class);
            openIntent.setAction("com.anise.flow.ACTION_OPEN_APP");
            openIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            PendingIntent openPendingIntent = PendingIntent.getActivity(
                    context,
                    1002,
                    openIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            views.setOnClickPendingIntent(R.id.widget_add_action, addPendingIntent);
            views.setOnClickPendingIntent(R.id.widget_open_action, openPendingIntent);
            manager.updateAppWidget(appWidgetId, views);
        }
    }
}
