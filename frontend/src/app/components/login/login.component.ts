import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.services';
import { Router } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, MatProgressBarModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';
  isLoading: boolean = false;

  constructor(private authService: AuthService, private router: Router) { }

  async login() {
    this.isLoading = true;
    if (await this.authService.login(this.username, this.password)) {
      this.router.navigate(['/invoices']);
    } else {
      this.errorMessage = 'Invalid credentials';
    }
    this.isLoading = false;
  }
}
