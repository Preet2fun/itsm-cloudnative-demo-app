package com.itsmcloudnative.delivery.tenant;

/** Holds the current request's tenant slug, set by {@link TenantFilter}. */
public final class TenantContext {
    private static final ThreadLocal<String> CURRENT = new ThreadLocal<>();

    private TenantContext() {}

    public static void set(String slug) {
        CURRENT.set(slug);
    }

    public static String get() {
        return CURRENT.get();
    }

    public static void clear() {
        CURRENT.remove();
    }
}
