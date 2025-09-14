import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "@sequelize/core";
import {
  Attribute,
  AutoIncrement,
  BelongsToMany,
  NotNull,
  PrimaryKey,
  Unique,
} from "@sequelize/core/decorators-legacy";
import { SqliteDialect } from "@sequelize/sqlite3";
import {
  BelongsToManyGetAssociationsMixin,
  BelongsToManyRemoveAssociationsMixin,
  BelongsToManySetAssociationsMixin,
  NonAttribute,
} from "sequelize";

const sequelize = new Sequelize({ dialect: SqliteDialect });

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  @Attribute(DataTypes.INTEGER)
  @PrimaryKey
  @AutoIncrement
  declare id: CreationOptional<number>;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare name: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  @Unique
  declare email: string;

  @Attribute(DataTypes.STRING)
  @NotNull
  declare password: string;

  //<-------------- Relations --------------->

  @BelongsToMany(() => User, {
    through: "Friends",
    inverse: {
      as: "User",
    },
    foreignKey: "requesterId",
    otherKey: "addresseeId",
  })
  declare friends?: NonAttribute<User[]>;

  declare getFriends: BelongsToManyGetAssociationsMixin<User>;

  declare setFriends: BelongsToManySetAssociationsMixin<User, User["id"]>;

  declare removeFriends: BelongsToManyRemoveAssociationsMixin<User, User["id"]>;
}
