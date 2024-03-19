import { Injectable } from "@angular/core";
import { SidebarComponent, tab } from "../../core/components/sidebar/sidebar.component";

@Injectable({ providedIn: 'root' })
export class SidebarService {
  selectTab!: (arg: tab, show: boolean) => void;
  toggleSidebar!: () => void;

  public init(component: SidebarComponent) {
    this.selectTab = component.selectTab.bind(component);
    this.toggleSidebar = component.toggleSidebar.bind(component);
  }
}