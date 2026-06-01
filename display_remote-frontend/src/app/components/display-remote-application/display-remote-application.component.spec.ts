import {ComponentFixture, TestBed} from '@angular/core/testing';
import { DisplayRemoteApplicationComponent } from './display-remote-application.component';
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {Observable, of} from "rxjs";

describe('DisplayRemoteApplicationComponent', () => {
  let fixture: ComponentFixture<DisplayRemoteApplicationComponent>;
  let component: DisplayRemoteApplicationComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [DisplayRemoteApplicationComponent],
      imports: [TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader, useValue: {
            getTranslation(): Observable<Record<string, string>> {
              return of({});
            }
          }
        }
      })],
    }).compileComponents();

    fixture = TestBed.createComponent(DisplayRemoteApplicationComponent);
    component = fixture.componentInstance;
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
