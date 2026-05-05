#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, String};

#[contracttype]
#[derive(Clone)]
pub struct Profile {
    pub username: String,
    pub photo_hash: String,
    pub updated_at: u64,
}

#[contracttype]
pub enum DataKey {
    Profile(Address),
}

#[contract]
pub struct ProfileContract;

#[contractimpl]
impl ProfileContract {
    pub fn set_profile(env: Env, owner: Address, username: String, photo_hash: String) {
        owner.require_auth();
        let profile = Profile {
            username,
            photo_hash,
            updated_at: env.ledger().timestamp(),
        };
        env.storage()
            .persistent()
            .set(&DataKey::Profile(owner.clone()), &profile);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Profile(owner), 100_000, 100_000);
    }

    pub fn get_profile(env: Env, owner: Address) -> Option<Profile> {
        env.storage()
            .persistent()
            .get(&DataKey::Profile(owner))
    }
}
