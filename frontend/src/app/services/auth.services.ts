import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private loggedInUser: string | null = null;
  private loggedInUserKey = 'loggedInUser';

  login(username: string, password: string): boolean {
    // ✅ Use Record<string, string> to allow dynamic keys
    const validUsers: Record<string, string> = {
      CHK: "chk123",
      CHL: "chl123",
      GKS: 'gks123',
      HSL: "hsl123",
      HYH: "hyh123",
      KCH: "kch123",
      KCL: "kcl123",
      KCY: "kcy123",
      KKS: "kks123",
      LCN: "lcn123",
      LHS: "lhs123",
      LKF: "lkf123",
      LKY: "lky123",
      LSK: "lsk123",
      LSS: "lss123",
      LSY: "lsy123",
      LVC: "lvc123",
      LWS: "lws123",
      SCJ: "scj123",
      SKW: "skw123",
      TCH: "tch123",
      TFS: "tfs123",
      TKG: "tkg123",
      TKK: "tkk123",
      UCK: "uck123",
      WKH: "wkh123",
      YAPKL: "yapkl123",
      YCL: "ycl123",
      YCT: "yct123",
      YYC: 'yyc123',
    };

    const normalizedUsername = username.toUpperCase(); // Convert to uppercase

    if (validUsers[normalizedUsername] && validUsers[normalizedUsername] === password) {
      this.loggedInUser = normalizedUsername;
      localStorage.setItem('loggedInUser', normalizedUsername); // ✅ Store in localStorage
      return true;
    }
    return false;
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
}
