import type { Album } from "../../domain/album/Album.js";
import type { AlbumRepository } from "../../domain/album/AlbumRepository.js";
import { UserNotFoundError } from "../../domain/user/errors.js";
import type { UserRepository } from "../../domain/user/UserRepository.js";

export interface GetAlbumInput {
  viewerId: string;
  username: string;
}

// Someone's album: only the memories the viewer is allowed to see,
// the same rule as the journal (everyone / friends / only me)
export class GetAlbum {
  constructor(
    private readonly users: UserRepository,
    private readonly albums: AlbumRepository,
  ) {}

  async execute({ viewerId, username }: GetAlbumInput): Promise<Album> {
    const owner = await this.users.findByUsername(username.toLowerCase());
    if (!owner) throw new UserNotFoundError();

    const years = await this.albums.findYears(owner.id, viewerId);
    return {
      owner: {
        id: owner.id,
        username: owner.username,
        firstName: owner.firstName,
        lastName: owner.lastName,
        profilePhotoUrl: owner.profilePhotoUrl,
      },
      years,
    };
  }
}
