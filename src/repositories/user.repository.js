export class UserRepository {
    getByExternalId(_messenger, _externalUserId) {
        throw new Error("UserRepository.getByExternalId() не реализован");
    }

    getAll() {
        throw new Error("UserRepository.getAll() не реализован");
    }

    save(_user) {
        throw new Error("UserRepository.save() не реализован");
    }
}
