import { TranslateService } from '@ngx-translate/core';
import { first } from 'rxjs/operators';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    inject,
    Input,
    OnChanges,
    SimpleChanges,
} from '@angular/core';
import { ApplicationPresenter, ApplicationPresenterAPI, RobotSettings } from '@universal-robots/contribution-api';
import { InputValidator } from '@universal-robots/ui-models';
import { DisplayRemoteApplicationNode } from './display-remote-application.node';
import { isValidRemoteAddress } from './remote-address.util';

@Component({
    templateUrl: './display-remote-application.component.html',
    styleUrls: ['./display-remote-application.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class DisplayRemoteApplicationComponent implements ApplicationPresenter, OnChanges {
    @Input() applicationAPI: ApplicationPresenterAPI;
    @Input() robotSettings: RobotSettings;
    @Input() applicationNode: DisplayRemoteApplicationNode;

    protected readonly translateService = inject(TranslateService);
    protected readonly cd = inject(ChangeDetectorRef);

    urlValidators: InputValidator[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes?.robotSettings) {
            if (!changes?.robotSettings?.currentValue) {
                return;
            }

            if (changes?.robotSettings?.isFirstChange()) {
                if (changes?.robotSettings?.currentValue) {
                    this.translateService.use(changes?.robotSettings?.currentValue?.language);
                }
                this.translateService.setDefaultLang('en');
                this.updateUrlValidators();
            }

            this.translateService
                .use(changes?.robotSettings?.currentValue?.language)
                .pipe(first())
                .subscribe(() => {
                    this.updateUrlValidators();
                    this.cd.detectChanges();
                });
        }
    }

    private updateUrlValidators(): void {
        this.urlValidators = [
            (value: string) => {
                const trimmed = (value ?? '').trim();
                if (!trimmed || isValidRemoteAddress(trimmed)) {
                    return null;
                }
                return this.translateService.instant(
                    'application.nodes.universal-robots-display-remote-display-remote-application.url-invalid',
                );
            },
        ];
    }

    onRemoteUrlChanged(url: string): void {
        if (!this.applicationNode) {
            return;
        }
        this.applicationNode.remoteUrl = url.trim();
        this.saveNode();
    }

    saveNode(): void {
        this.cd.detectChanges();
        this.applicationAPI.applicationNodeService.updateNode(this.applicationNode);
    }
}
