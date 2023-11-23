"use strict";

class DeadMedia {
  constructor(id, name, type, desc) {
    this.id = id;
    this.name = name;
    this.type = type;
    this.desc = desc;
  }
}

/**
 * Generates a random number of ms 4 and 32 (4 inclusive, 32 exclusive).
 * @returns {number} A random number of milliseconds.
 */
function smallNumberOfMS() {
  return Math.floor(Math.random() * 29) + 4;
}

/**
 * Represents a MediaStore for managing dead media resources.
 */
class MediaStore {
  #resources;
  #nextId;

  /**
   * Create a MediaStore object.
   * @param {boolean} [errorModeOn=false] - Useful for testing. All promises reject.
   */
  constructor(errorModeOn = false) {
    this.errorModeOn = errorModeOn;
    this.#resources = [];
    this.#nextId = 0;
  }

  /**
   * Create a new media resource and add it to the store.
   * @param {string} name - The name of the media.
   * @param {string} type - The type of the media.
   * @param {string} desc - A description of the media.
   * @returns {Promise<number>} A promise that resolves with the ID of the created media.
   */
  create(name, type, desc) {
    return new Promise((resolve, reject) => {
      if (this.errorModeOn) {
        reject('Error in store.');
      }
      setTimeout(() => {
        const m = new DeadMedia(this.#nextId, name, type, desc);
        this.#resources.push(m);
        this.#nextId += 1;
        resolve(m.id);
      }, smallNumberOfMS());
    });
  }

  /**
   * Retrieve a media resource by its ID.
   * @param {number} id - The ID of the media to retrieve.
   * @returns {Promise<DeadMedia>} A promise that resolves with the retrieved media object.
   */
  retrieve(id) {
    return new Promise((resolve, reject) => {
      if (this.errorModeOn) {
        reject('Error in store.');
      }
      setTimeout(() => {
        const predicate = m => m.id === id;
        const found = this.#resources.find(predicate);
        if (found) {
          resolve(found);
        } else {
          reject(`Error: cannot find media with ID: ${id}`);
        }
      }, smallNumberOfMS());
    });
  }

  /**
   * Retrieve all media resources in the store.
   * @returns {Promise<DeadMedia[]>} A promise that resolves with an array of media objects.
   */
  retrieveAll() {
    return new Promise((resolve, reject) => {
      if (this.errorModeOn) {
        reject('Error in store.');
      }
      setTimeout(() => {
        return resolve(this.#resources);
      }, smallNumberOfMS());
    });
  }

  /**
   * Update a media resource with new information.
   * @param {number} id - The ID of the media to update.
   * @param {string} name - The new name for the media.
   * @param {string} type - The new type for the media.
   * @param {string} desc - The new description for the media.
   * @returns {Promise<DeadMedia>} A promise that resolves with the updated media object.
   */
  update(id, name, type, desc) {
    return new Promise((resolve, reject) => {
      if (this.errorModeOn) {
        reject('Error in store.');
      }
      setTimeout(() => {
        const idx = this.#resources.findIndex(m => m.id == id);
        const wasFound = idx != -1;
        if (wasFound) {
          this.#resources[idx].name = name;
          this.#resources[idx].type = type;
          this.#resources[idx].desc = desc;
          resolve(this.#resources[idx]);
        } else {
          reject(`Error: cannot find media with ID: ${id}`);
        }
      }, smallNumberOfMS());
    });
  }

  /**
   * Delete a media resource by its ID.
   * @param {number} id - The ID of the media to delete.
   * @returns {Promise<DeadMedia>} A promise that resolves with the deleted media object.
   */
  delete(id) {
    return new Promise((resolve, reject) => {
      if (this.errorModeOn) {
        reject('Error in store.');
      }
      setTimeout(() => {
        const idx = this.#resources.findIndex(m => m.id == id);
        const wasFound = idx != -1;
        if (wasFound) {
          const removedResource = this.#resources[idx];
          this.#resources.splice(idx, 1);
          resolve(removedResource);
        } else {
          reject(`Error: cannot find media with ID: ${id}`);
        }
      }, smallNumberOfMS());
    });
  }
}

exports.MediaStore = MediaStore;