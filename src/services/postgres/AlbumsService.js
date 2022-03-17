/* eslint-disable no-underscore-dangle */
const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const { mapDBToModelAlbums } = require('../../utils');
const NotFoundError = require('../../exceptions/NotFoundError');

class AlbumsService {
  constructor() {
    this._pool = new Pool();
  }

  async addAlbum({
    name, year,
  }) {
    const id = `album-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3, $4, $5) RETURNING id',
      values: [id, name, year, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Add album failed');
    }

    return result.rows[0].id;
  }

  async getAlbums() {
    const result = await this._pool.query('SELECT id, name, year FROM albums');
    return result.rows;
  }

  async getAlbumById(id) {
    const queryAlbum = {
      text: `SELECT albums.id, albums.name, albums.year FROM albums
      WHERE albums.id = $1`,
      values: [id],
    };
    const albumsData = await this._pool.query(queryAlbum);
    if (!albumsData.rows.length) {
      throw new NotFoundError('Album not found');
    }

    const querySong = {
      text: `SELECT
      songs.id, songs.title, songs.performer
      FROM albums
      JOIN songs ON songs.album_id = albums.id
      WHERE albums.id = $1`,
      values: [id],
    };

    const songsData = await this._pool.query(querySong);

    const response = albumsData.rows.map(mapDBToModelAlbums)[0];
    response.songs = songsData.rows;

    return response;
  }

  async editAlbumById(id, {
    name, year,
  }) {
    const updatedAt = new Date().toISOString();
    const query = {
      text: 'UPDATE albums SET name = $1, year = $2, updated_at = $3 WHERE id = $4 RETURNING id',
      values: [name, year, updatedAt, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Update album failed, Id not found');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id = $1 RETURNING id',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Delete album failed. Id not found');
    }
  }
}

module.exports = AlbumsService;
