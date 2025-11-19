import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

interface UploadResponse {
  message: string;
  filename: string;
}

@Injectable({ providedIn: 'root' })
export class PhotoService {
  private apiUrl = `${window.location.protocol}//${window.location.hostname}:3000/photo`; 


  constructor(private http: HttpClient) {}

  async uploadPhoto(file: File, token: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('photo', file);

    return firstValueFrom(
      this.http.post<UploadResponse>(`${this.apiUrl}/upload`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  }

  async getPhotos(token: string): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  }


  async deletePhoto(id: number, token: string) {
    return firstValueFrom(
      this.http.delete(`${this.apiUrl}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  }

  async getPhotoById(id: number, token: string): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  }

  async updatePhoto(id: number, formData: FormData, token: string) {
    return firstValueFrom(
      this.http.put(`${this.apiUrl}/${id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
    );
  }

async getAllPhotos(token: string): Promise<any[]> {
  return firstValueFrom(
    this.http.get<any[]>(`${this.apiUrl}/all`, {
      headers: { Authorization: `Bearer ${token}` }
    })
  );
}


}


