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
import {
    OperatorScreen,
    OperatorScreenPresenter,
    OperatorScreenPresenterAPI,
    RobotSettings,
} from '@universal-robots/contribution-api';
import {
    DISPLAY_REMOTE_APPLICATION_NODE_TYPE,
    DisplayRemoteApplicationNode,
} from '../display-remote-application/display-remote-application.node';
import {
    normalizeRemoteAddress,
    toSafeIframeUrl,
} from '../display-remote-application/remote-address.util';

interface DisplayRemoteOperatorScreenPresenter
    extends Omit<OperatorScreenPresenter, 'robotSettings' | 'presenterAPI' | 'operatorScreen'> {
    robotSettings: InputSignal<RobotSettings | undefined>;
    presenterAPI: InputSignal<OperatorScreenPresenterAPI | undefined>;
    operatorScreen: InputSignal<OperatorScreen | undefined>;
}

@Component({
    templateUrl: './display-remote-operator.component.html',
    styleUrls: ['./display-remote-operator.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class DisplayRemoteOperatorComponent
    implements DisplayRemoteOperatorScreenPresenter, OnDestroy
{
    private static readonly remoteReachabilityTimeoutMs = 10000;

    private readonly translateService = inject(TranslateService);
    private readonly sanitizer = inject(DomSanitizer);
    private readonly cd = inject(ChangeDetectorRef);
    private reachabilityAbortController?: AbortController;
    private reachabilityTimeout?: ReturnType<typeof setTimeout>;
    private reachabilityRequestId = 0;

    readonly robotSettings = input<RobotSettings | undefined>();
    readonly presenterAPI = input<OperatorScreenPresenterAPI | undefined>();
    readonly operatorScreen = input<OperatorScreen | undefined>();

    safeUrl: SafeResourceUrl | null = null;
    isCheckingRemoteUrl = false;
    remoteLoadErrorKey: string | null = null;
    emptyStateKey = 'operator-screen.universal-robots-display-remote-display-remote-operator.configure-url';

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

    private async refreshRemoteUrl(api: OperatorScreenPresenterAPI): Promise<void> {
        try {
            const node = (await api.applicationService.getApplicationNode(
                DISPLAY_REMOTE_APPLICATION_NODE_TYPE,
            )) as DisplayRemoteApplicationNode;
            this.applyRemoteUrl(node?.remoteUrl ?? '');
        } catch {
            this.cancelReachabilityCheck();
            this.safeUrl = null;
            this.isCheckingRemoteUrl = false;
            this.remoteLoadErrorKey = null;
            this.emptyStateKey =
                'operator-screen.universal-robots-display-remote-display-remote-operator.load-error';
            this.cd.markForCheck();
        }
    }

    private applyRemoteUrl(url: string): void {
        const trimmed = url.trim();
        if (!trimmed) {
            this.cancelReachabilityCheck();
            this.safeUrl = null;
            this.isCheckingRemoteUrl = false;
            this.remoteLoadErrorKey = null;
            this.emptyStateKey =
                'operator-screen.universal-robots-display-remote-display-remote-operator.configure-url';
            this.cd.markForCheck();
            return;
        }

        const normalizedUrl = normalizeRemoteAddress(trimmed);
        const safeUrl = toSafeIframeUrl(this.sanitizer, trimmed);
        if (!normalizedUrl || !safeUrl) {
            this.cancelReachabilityCheck();
            this.safeUrl = null;
            this.isCheckingRemoteUrl = false;
            this.remoteLoadErrorKey = null;
            this.emptyStateKey =
                'operator-screen.universal-robots-display-remote-display-remote-operator.invalid-url';
            this.cd.markForCheck();
            return;
        }

        this.safeUrl = safeUrl;
        this.isCheckingRemoteUrl = true;
        this.remoteLoadErrorKey = null;
        this.startReachabilityCheck(normalizedUrl);
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
        }, DisplayRemoteOperatorComponent.remoteReachabilityTimeoutMs);

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
                        ? 'operator-screen.universal-robots-display-remote-display-remote-operator.timeout-error'
                        : 'operator-screen.universal-robots-display-remote-display-remote-operator.unreachable-error';
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
