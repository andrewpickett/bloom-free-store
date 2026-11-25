from bcrypt import hashpw, gensalt, checkpw

if __name__ == "__main__":
    # bcrypt_hash = hashpw("aw96b6ap".encode("utf-8"), gensalt()).decode("utf-8")
    # print(bcrypt_hash)

    print(checkpw("aw96b6ap".encode("utf-8"), "$2b$12$kmBhLb7MGIV9/2aI/.YQZeV.8XNjTv0X7zMfhT.zkx9JcmrsaHBlO".encode("utf-8")))