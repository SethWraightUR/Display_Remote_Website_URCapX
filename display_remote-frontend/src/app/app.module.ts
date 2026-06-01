import { DoBootstrap, Injector, NgModule } from '@angular/core';
import { DisplayRemoteApplicationComponent } from './components/display-remote-application/display-remote-application.component';
import { DisplayRemoteSidebarComponent } from './components/display-remote-sidebar/display-remote-sidebar.component';
import { DisplayRemoteOperatorComponent } from './components/display-remote-operator/display-remote-operator.component';

import { UIAngularComponentsModule } from '@universal-robots/ui-angular-components';
import { BrowserModule } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { HttpBackend, HttpClientModule } from '@angular/common/http';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import {MultiTranslateHttpLoader} from 'ngx-translate-multi-http-loader';
import { PATH } from '../generated/contribution-constants';
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

export const httpLoaderFactory = (http: HttpBackend) =>
    new MultiTranslateHttpLoader(http, [
      { prefix: PATH + '/assets/i18n/', suffix: '.json' },
      { prefix: './ui/assets/i18n/', suffix: '.json' },
    ]);

@NgModule({

  declarations: [
      DisplayRemoteApplicationComponent,
      DisplayRemoteSidebarComponent,
      DisplayRemoteOperatorComponent
],
    imports: [
      BrowserModule,
      BrowserAnimationsModule,
      UIAngularComponentsModule,
      HttpClientModule,
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useFactory: httpLoaderFactory, deps: [HttpBackend] },
        useDefaultLang: false,
      })
    ],
    providers: [],
})

export class AppModule implements DoBootstrap {
  constructor(private injector: Injector) {
  }

  ngDoBootstrap() {
    const displayremoteapplicationComponent = createCustomElement(DisplayRemoteApplicationComponent, {injector: this.injector});
    customElements.define('universal-robots-display-remote-display-remote-application', displayremoteapplicationComponent);
    const displayremotesidebarComponent = createCustomElement(DisplayRemoteSidebarComponent, {injector: this.injector});
    customElements.define('universal-robots-display-remote-display-remote-sidebar', displayremotesidebarComponent);
    const displayremoteoperatorComponent = createCustomElement(DisplayRemoteOperatorComponent, {injector: this.injector});
    customElements.define('universal-robots-display-remote-display-remote-operator', displayremoteoperatorComponent);
  }

  // This function is never called, because we don't want to actually use the workers, just tell webpack about them
  registerWorkersWithWebPack() {
    new Worker(new URL('./components/display-remote-application/display-remote-application.behavior.worker.ts'
        /* webpackChunkName: "display-remote-application.worker" */, import.meta.url), {
      name: 'display-remote-application',
      type: 'module'
    });new Worker(new URL('./components/display-remote-sidebar/display-remote-sidebar.behavior.worker.ts'
        /* webpackChunkName: "display-remote-sidebar.worker" */, import.meta.url), {
      name: 'display-remote-sidebar',
      type: 'module'
    });new Worker(new URL('./components/display-remote-operator/display-remote-operator.behavior.worker.ts'
        /* webpackChunkName: "display-remote-operator.worker" */, import.meta.url), {
      name: 'display-remote-operator',
      type: 'module'
    });
  }
}

