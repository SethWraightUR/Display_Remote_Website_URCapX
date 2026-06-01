import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    effect,
    inject,
    input,
    InputSignal,
    OnDestroy,
} from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { RobotSettings, SidebarItemPresenter, SidebarPresenterAPI } from '@universal-robots/contribution-api';
import {
    DISPLAY_REMOTE_APPLICATION_NODE_TYPE,
    DisplayRemoteApplicationNode,
} from '../display-remote-application/display-remote-application.node';
import {
    normalizeRemoteAddress,
    toSafeIframeUrl,
} from '../display-remote-application/remote-address.util';

interface SignalSidebarItemPresenter
    extends Omit<SidebarItemPresenter, 'robotSettings' | 'presenterAPI'> {
    robotSettings: InputSignal<RobotSettings | undefined>;
    presenterAPI: InputSignal<SidebarPresenterAPI | undefined>;
}

@Component({
    templateUrl: './display-remote-sidebar.component.html',
    styleUrls: ['./display-remote-sidebar.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class DisplayRemoteSidebarComponent implements SignalSidebarItemPresenter, OnDestroy {
    private static readonly remoteReachabilityTimeoutMs = 10000;

    private readonly translateService = inject(TranslateService);
    private readonly sanitizer = inject(DomSanitizer);
    private readonly cd = inject(ChangeDetectorRef);
    private normalizedRemoteUrl: string | null = null;
    private reachabilityAbortController?: AbortController;
    private reachabilityTimeout?: ReturnType<typeof setTimeout>;
    private reachabilityRequestId = 0;

    readonly robotSettings = input<RobotSettings | undefined>();
    readonly presenterAPI = input<SidebarPresenterAPI | undefined>();

    safeUrl: SafeResourceUrl | null = null;
    isRemoteViewOpen = false;
    isCheckingRemoteUrl = false;
    remoteLoadErrorKey: string | null = null;
    hintKey = 'sidebar-items.universal-robots-display-remote-display-remote-sidebar.configure-url';

    readonly onCreateComponent = effect(() => {
        const language = this.robotSettings()?.language;
        if (language) {
            this.translateService.use(language);
        }
        this.translateService.setDefaultLang('en');
    });

    readonly loadRemoteUrl = effect(() => {
        const api = this.presenterAPI();
        if (!api) {
            return;
        }

        void this.refreshRemoteUrl(api);
    });

    ngOnDestroy(): void {
        this.cancelReachabilityCheck();
    }

    openRemoteView(): void {
        if (!this.safeUrl || !this.normalizedRemoteUrl) {
            return;
        }
        this.isRemoteViewOpen = true;
        this.remoteLoadErrorKey = null;
        this.startReachabilityCheck(this.normalizedRemoteUrl);
        this.cd.markForCheck();
    }

    closeRemoteView(): void {
        this.cancelReachabilityCheck();
        this.isRemoteViewOpen = false;
        this.remoteLoadErrorKey = null;
        this.cd.markForCheck();
    }

    private async refreshRemoteUrl(api: SidebarPresenterAPI): Promise<void> {
        try {
            const node = (await api.applicationService.getApplicationNode(
                DISPLAY_REMOTE_APPLICATION_NODE_TYPE,
            )) as DisplayRemoteApplicationNode;
            this.applyRemoteUrl(node?.remoteUrl ?? '');
        } catch {
            this.cancelReachabilityCheck();
            this.safeUrl = null;
            this.normalizedRemoteUrl = null;
            this.remoteLoadErrorKey = null;
            this.isRemoteViewOpen = false;
            this.hintKey = 'sidebar-items.universal-robots-display-remote-display-remote-sidebar.load-error';
            this.cd.markForCheck();
        }
    }

    private applyRemoteUrl(url: string): void {
        const normalizedUrl = normalizeRemoteAddress(url);
        const safeUrl = toSafeIframeUrl(this.sanitizer, url);
        if (normalizedUrl && safeUrl) {
            this.safeUrl = safeUrl;
            this.normalizedRemoteUrl = normalizedUrl;
            this.remoteLoadErrorKey = null;
            this.hintKey = 'sidebar-items.universal-robots-display-remote-display-remote-sidebar.configure-url';
            if (this.isRemoteViewOpen) {
                this.startReachabilityCheck(normalizedUrl);
            }
            this.cd.markForCheck();
            return;
        }

        this.cancelReachabilityCheck();
        this.safeUrl = null;
        this.normalizedRemoteUrl = null;
        this.remoteLoadErrorKey = null;
        this.isRemoteViewOpen = false;
        this.hintKey = url.trim()
            ? 'sidebar-items.universal-robots-display-remote-display-remote-sidebar.invalid-url'
            : 'sidebar-items.universal-robots-display-remote-display-remote-sidebar.configure-url';
        this.cd.markForCheck();
    }

    private startReachabilityCheck(url: string): void {
        this.cancelReachabilityCheck();
        this.isCheckingRemoteUrl = true;

        const requestId = ++this.reachabilityRequestId;
        const abortController = new AbortController();
        this.reachabilityAbortController = abortController;
        this.reachabilityTimeout = setTimeout(() => {
            abortController.abort();
        }, DisplayRemoteSidebarComponent.remoteReachabilityTimeoutMs);

        void fetch(url, {
            cache: 'no-store',
            mode: 'no-cors',
            signal: abortController.signal,
        })
            .then(() => {
                if (requestId === this.reachabilityRequestId) {
                    this.isCheckingRemoteUrl = false;
                    this.remoteLoadErrorKey = null;
                    this.cd.markForCheck();
                }
            })
            .catch((error: unknown) => {
                if (requestId !== this.reachabilityRequestId) {
                    return;
                }

                this.isCheckingRemoteUrl = false;
                this.remoteLoadErrorKey =
                    error instanceof DOMException && error.name === 'AbortError'
                        ? 'sidebar-items.universal-robots-display-remote-display-remote-sidebar.timeout-error'
                        : 'sidebar-items.universal-robots-display-remote-display-remote-sidebar.unreachable-error';
                this.cd.markForCheck();
            })
            .finally(() => {
                if (requestId === this.reachabilityRequestId) {
                    this.clearReachabilityTimeout();
                }
            });
    }

    private cancelReachabilityCheck(): void {
        this.reachabilityRequestId++;
        this.reachabilityAbortController?.abort();
        this.reachabilityAbortController = undefined;
        this.isCheckingRemoteUrl = false;
        this.clearReachabilityTimeout();
    }

    private clearReachabilityTimeout(): void {
        if (this.reachabilityTimeout) {
            clearTimeout(this.reachabilityTimeout);
            this.reachabilityTimeout = undefined;
        }
    }
}
