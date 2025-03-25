import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { InvoiceService } from '../../services/invoice.service';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [FormsModule, CommonModule, MatDialogModule, MatButtonModule],
  templateUrl: './change-password-dialog.component.html',
  styleUrls: ['./change-password-dialog.component.css']
})
export class ChangePasswordDialogComponent {
  newPassword = '';
  changePasswordMessage = '';
  confirmNewPassword = '';

  constructor(
    private invoiceService: InvoiceService,
    public dialogRef: MatDialogRef<ChangePasswordDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { username: string }
  ) { }

  changePassword() {
    this.invoiceService.changePassword(this.data.username, this.newPassword).subscribe(response => {
      if (response.success) {
        this.changePasswordMessage = 'Password updated successfully!';
        setTimeout(() => this.dialogRef.close(), 2000); // Close after success
      } else {
        this.changePasswordMessage = response.message || 'Failed to update password.';
      }
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
