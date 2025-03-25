import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { AppComponent } from './app/app.component';
import { LoginComponent } from './app/components/login/login.component';
import { InvoiceTableComponent } from './app/components/invoice-table/invoice-table.component';
import { ChangePasswordDialogComponent } from './app/components/change-password-dialog/change-password-dialog.component';
import { HttpClientModule } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter([
      { path: 'login', component: LoginComponent },
      { path: 'invoices', component: InvoiceTableComponent },
      { path: 'change-password', component: ChangePasswordDialogComponent },
      { path: '**', redirectTo: 'login' } // Redirects unknown routes to login
    ]),
    provideHttpClient(),
    importProvidersFrom(FormsModule, MatDatepickerModule, MatNativeDateModule, HttpClientModule),
  ],
}).catch((err) => console.error(err));
