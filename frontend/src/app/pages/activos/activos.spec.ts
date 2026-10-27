import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Activos } from './activos';

describe('Activos', () => {
  let component: Activos;
  let fixture: ComponentFixture<Activos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Activos],
    }).compileComponents();

    fixture = TestBed.createComponent(Activos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
