import { Router, ActivatedRoute } from '@angular/router';
import { BackendService, CheckConfig } from './backend.service';
import { Component, OnInit } from '@angular/core';



@Component({
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})

export class StartComponent implements OnInit {
  checkConfigList: CheckConfig[] = [];
  private dataLoading = false;

  constructor(
    private bs: BackendService,
    private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit() {
    this.dataLoading = true;
    this.bs.getCheckConfigs().subscribe(myConfigs => {
      this.checkConfigList = myConfigs;
      this.checkConfigList.push(this.bs.basicTestConfig);
      this.dataLoading = false;
    });
  }

  // # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
  buttonStartCheck(c: CheckConfig) {
    this.router.navigate(['../run/' + c.id], {relativeTo: this.route});
  }
}