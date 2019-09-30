import debounce from "debounce";
import { computed, observable } from "mobx";
import { NextRouter, useRouter } from "next/router";
import { inject } from "react-ioc";
import { ProjectDto } from "../models/project-list.dto";
import { useRouterChange } from "../utils/router-hook";
import { BlueprintService } from "./blueprint.service";
import { FloorListService } from "./floor-list.service";
import { FloorRouterService } from "./floor-router.service";
import { FloorProvider } from "./floor.provider";
import { ProjectListService } from "./project-list.service";
import { IRootService } from "./root-sevice.interface";
// import { FloorService } from "./floor.service";

export class ProjectService implements IRootService {

  @computed public get project() {
    return this.data.project;
  }
  @observable public loading: boolean = false;

  @observable public data: {
    project: ProjectDto;
  } = {
    project: null,
  };

  private setLoading = debounce<(value: boolean) => void>((value) => {
    this.loading = value;
  }, 50);

  @inject(FloorRouterService) private floorRouterService: FloorRouterService;
  @inject(FloorProvider) private floorProvider: FloorProvider;
  @inject(BlueprintService) private blueprintService: BlueprintService;
  @inject(ProjectListService) private projectListService: ProjectListService;
  @inject(FloorListService) private floorListService: FloorListService;
  private router: NextRouter;

  public useHook() {
    this.router = useRouter();
    useRouterChange(this.onRouterChange);
  }

  public onRouterChange = () => {
    if (this.router.query.project_id != null) {
      this.loadProject(this.router.query.project_id as string);
    }
  }

  public async loadProject(id: number | string = this.project.id) {
    this.data.project = {
      id,
      name: "",
    };

    this.setLoading(true);
    try {
      const project = await this.floorProvider.getProject(id);
      this.data.project = project;
      await this.floorListService.loadList(project.id);
    } catch (error) {
      // tslint:disable-next-line
      console.error(error);
    } finally {
      this.setLoading(false);
    }
    return this.project;
  }

  public async saveProject() {
    this.setLoading(true);
    try {
      const project = await this.floorProvider.saveProject(this.data.project);
      this.data.project = project;
    } catch (error) {
      // tslint:disable-next-line
      console.error(error);
    } finally {
      this.setLoading(false);
    }
  }

  public async createProject(name: string) {
    this.setLoading(true);
    try {
      const data = await this.floorProvider.createProject(name);
      this.floorRouterService.openProject(data.id);
    } catch (error) {
      // tslint:disable-next-line
      console.error(error);
    } finally {
      this.setLoading(false);
    }
  }

  public async createProjectPlan(name: string, planName: string) {
    this.setLoading(true);
    try {
      const plan = this.blueprintService.getFloorplan();
      if (plan) {
        const data = await this.floorProvider.createProject(name);
        const floorplan = await this.floorProvider.createFloorplan(data.id, {
          data: {
            name: planName,
          },
          plan,
        });
        this.floorRouterService.openFloor(floorplan.id, data.id);
      }
    } catch (error) {
      // tslint:disable-next-line
      console.error(error);
    } finally {
      this.setLoading(false);
    }
  }

  public async deleteProject(id: number | string = this.data.project.id) {
    this.setLoading(true);
    try {
      const result = await this.floorProvider.deleteProject(id);
      if (result) {
        if (this.data.project && this.data.project.id === id) {
          this.floorRouterService.openProjectList();
        } else {
          this.projectListService.loadList();
        }
      }
    } catch (error) {
      // tslint:disable-next-line
      console.error(error);
    } finally {
      this.setLoading(false);
    }
  }
}
