import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { CardComponent } from './card.component';
import { Card } from '../../../../core/models/game.models';

describe('CardComponent', () => {
  let fixture: ComponentFixture<CardComponent>;
  let component: CardComponent;

  function makeCard(status: Card['status']): Card {
    const svg = TestBed.inject(DomSanitizer).bypassSecurityTrustHtml('<svg/>');
    return { id: 1, pairKey: 'braces', label: 'Braces', svg, status };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [CardComponent] });
    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
  });

  it('emits flip only when the card is hidden', () => {
    const spy = jasmine.createSpy('flip');
    fixture.componentRef.setInput('card', makeCard('hidden'));
    fixture.detectChanges();
    component.flip.subscribe(spy);

    component.onActivate();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not emit flip when already revealed', () => {
    const spy = jasmine.createSpy('flip');
    fixture.componentRef.setInput('card', makeCard('flipped'));
    fixture.detectChanges();
    component.flip.subscribe(spy);

    component.onActivate();
    expect(spy).not.toHaveBeenCalled();
  });

  it('reflects status through host classes', () => {
    fixture.componentRef.setInput('card', makeCard('matched'));
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.classList.contains('is-flipped')).toBeTrue();
    expect(host.classList.contains('is-matched')).toBeTrue();
  });
});
