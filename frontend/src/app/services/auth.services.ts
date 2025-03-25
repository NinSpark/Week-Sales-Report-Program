import { Injectable } from '@angular/core';
import { InvoiceService } from '../services/invoice.service';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedInUser: string | null = null;
  private loggedInUserKey = 'loggedInUser';

  constructor(private invoiceService: InvoiceService) { }

  async login(username: string, password: string): Promise<boolean> {
    try {
      const loginCredentials = await lastValueFrom(
        this.invoiceService.getLoginDetails(username.toUpperCase(), password)
      );

      if (loginCredentials && Object.keys(loginCredentials).length > 0) {
        this.loggedInUser = username.toUpperCase();
        localStorage.setItem('loggedInUser', username.toUpperCase()); // Store in localStorage
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  logout(): void {
    localStorage.removeItem('loggedInUser');
    this.loggedInUser = null;
  }

  getLoggedInUser(): string | null {
    return localStorage.getItem('loggedInUser');
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
