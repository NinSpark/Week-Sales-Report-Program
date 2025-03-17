import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.services';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  standalone: true,
  template: `<router-outlet></router-outlet>`
})
export class AppComponent implements OnInit {
  isLoggedIn = false;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.isLoggedIn = !!this.authService.getLoggedInUser(); // ✅ Convert to boolean

    // Redirect to login if not logged in
    if (!this.isLoggedIn && this.router.url !== '/login') {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    this.authService.logout();
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }
}
