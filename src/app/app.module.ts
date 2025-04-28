import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { HomeComponent } from '../Pages/home/home.component';
import { DifficultySelectorComponent } from '../Pages/difficulty-selector/difficulty-selector.component';
import { SandBoxComponent } from '../Pages/sand-box/sand-box.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    DifficultySelectorComponent,
    SandBoxComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
