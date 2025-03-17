import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.services';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  username = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {
    console.log('Login button clicked');
  }

  login() {
    if (this.authService.login(this.username, this.password)) {
      this.router.navigate(['/invoices']); // ✅ Redirect to invoices
    } else {
      this.errorMessage = 'Invalid credentials';
    }
  }
}
