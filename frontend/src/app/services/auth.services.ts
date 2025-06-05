import { Injectable } from '@angular/core';
import { InvoiceService } from '../services/invoice.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private invoiceService: InvoiceService) { }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const loginCredentials = await lastValueFrom(
        this.invoiceService.getLoginDetails(username.toUpperCase(), password)
      );

      if (loginCredentials && Object.keys(loginCredentials).length > 0) {
        localStorage.setItem('loggedInUser', username.toUpperCase()); // Store in localStorage
        localStorage.setItem('lensoDivision', loginCredentials.lenso_division);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem('loggedInUser');
  }

  getLoggedInUser(): string | null {
    return localStorage.getItem('loggedInUser');
  }

  isLensoDivision(): string | null {
    return localStorage.getItem('lensoDivision');
  }

  isLoggedIn(): boolean {
    return !!this.getLoggedInUser(); // ✅ Check if user is logged in
  }

  async changePassword(username: string, newPassword: string): Promise<boolean> {
    try {
      const response = await lastValueFrom(this.invoiceService.changePassword(username.toUpperCase(), newPassword));
      return response?.success ?? false;
    } catch (error) {
      console.error("Error changing password:", error);
      return false;
    }
  }
}
