import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { from } from 'rxjs';
import { OnInit } from '@angular/core';
import { User } from '../../../../models/user.model';
import { AuthenticationService } from '../../../../services/authentication.service';
@Component({
  selector: 'app-realmstable',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './realmstable.component.html',
  styleUrl: './realmstable.component.css',
})
export class RealmstableComponent implements OnInit {
  constructor(private authService : AuthenticationService) {}
  realms: String[] = [];
  ngOnInit(): void {
    this.getRealms();
  }


  getRealms() {
    from(this.authService.getRealms()).subscribe((data) => {
      console.log('Realms data:', data);
      if (data) {
        this.realms = data;
      } else {
        this.realms = [];
      }
    }
    );

  }

  getRealmsCount(): number {
    return this.realms.length;
  }
}
