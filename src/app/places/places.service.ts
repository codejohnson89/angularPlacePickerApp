import { Injectable, inject, signal } from '@angular/core';

import { Place } from './place.model';
import { catchError, map, tap, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ErrorService } from '../shared/error.service';

@Injectable({
  providedIn: 'root',
})
export class PlacesService {
  private errorService = inject(ErrorService);
  private httpClient = inject(HttpClient);
  private userPlaces = signal<Place[]>([]);

  loadedUserPlaces = this.userPlaces.asReadonly();

  loadAvailablePlaces() {
    return this.fetchPlaces(
      'http://localhost:3000/places',
      'An error occurred while fetching places.'
    );
  }

  loadUserPlaces() {
    return this.fetchPlaces(
      'http://localhost:3000/user-places',
      'An error occurred while fetching user favorite places.'
    ).pipe(tap({
      next: (places) => {
        this.userPlaces.set(places);
      }

    }))
  }

  addPlaceToUserPlaces(place: Place) {
    const prevPlaces = this.userPlaces();

    if (!prevPlaces.some((p) => p.id === place.id)) {
      this.userPlaces.set([...prevPlaces, place]);
    }

    return this.httpClient.put('http://localhost:3000/user-places', {
      placeId: place.id,
    }).pipe(
    catchError((error) => {
      this.userPlaces.set(prevPlaces);
      this.errorService.showError('An error occurred while adding the place to your favorite places.');
      return throwError(() => new Error('An error occurred while adding the place to your favorite places.'));
    })
  )
  }

  removeUserPlace(place: Place) {
    const prevPlaces = this.userPlaces();

    if (prevPlaces.some((p) => p.id === place.id)) {
      this.userPlaces.set(prevPlaces.filter((p) => p.id !== place.id));
    }

    return this.httpClient.delete(`http://localhost:3000/user-places/${place.id}`)
      .pipe(
        catchError((error) => {
          this.userPlaces.set(prevPlaces);
          this.errorService.showError('An error occurred while removing the place from your favorite places.');
          return throwError(() => new Error('An error occurred while removing the place from your favorite places.'));
        })
      )
  }

  private fetchPlaces(url: string, errorMessage: string) {
    return this.httpClient
      .get<{places: Place[]}>(url)
      .pipe( map((res) => res.places),
      catchError((err) => {
        console.log(err);
        return throwError(() =>
        new Error(errorMessage)
      )}))
  }
}
