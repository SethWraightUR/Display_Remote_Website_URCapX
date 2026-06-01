import { SecurityContext } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

const HTTP_URL_PATTERN = /^https?:\/\/.+/i;
const BARE_IPV4_PATTERN = /^((?:\d{1,3}\.){3}\d{1,3})(?::(\d+))?(\/.*)?$/;

function isValidIpv4Octets(ip: string): boolean {
    return ip.split('.').every((octet) => {
        const value = Number(octet);
        return Number.isInteger(value) && value >= 0 && value <= 255 && octet === String(value);
    });
}

function isBareIpv4Address(value: string): boolean {
    const match = value.match(BARE_IPV4_PATTERN);
    if (!match) {
        return false;
    }
    return isValidIpv4Octets(match[1]);
}

/** Returns true for empty values, http(s) URLs, or bare IPv4 addresses (with optional port/path). */
export function isValidRemoteAddress(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed) {
        return true;
    }
    if (HTTP_URL_PATTERN.test(trimmed)) {
        return true;
    }
    return isBareIpv4Address(trimmed);
}

/** Normalizes input to an iframe-safe URL, prefixing bare IPs with http://. */
export function normalizeRemoteAddress(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    if (HTTP_URL_PATTERN.test(trimmed)) {
        return trimmed;
    }
    if (isBareIpv4Address(trimmed)) {
        return `http://${trimmed}`;
    }
    return null;
}

/** Converts a remote address to a sanitized iframe URL, or null if invalid. */
export function toSafeIframeUrl(sanitizer: DomSanitizer, value: string): SafeResourceUrl | null {
    const normalized = normalizeRemoteAddress(value);
    if (!normalized) {
        return null;
    }

    const sanitized = sanitizer.sanitize(SecurityContext.URL, normalized);
    if (!sanitized) {
        return null;
    }

    return sanitizer.bypassSecurityTrustResourceUrl(sanitized);
}
