import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from '../Pages/home/home.component';
import { DifficultySelectorComponent } from '../Pages/difficulty-selector/difficulty-selector.component';
import { SandBoxComponent } from '../Pages/sand-box/sand-box.component';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'difficultySelector', component: DifficultySelectorComponent },
  { path: 'sandBox', component: SandBoxComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
