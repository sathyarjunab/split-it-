import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
} from "@sequelize/core";
import { Attribute, Comment } from "@sequelize/core/decorators-legacy";

export enum status {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  DECLINED = "DECLINED",
}

export class Friends extends Model<
  InferAttributes<Friends>,
  InferCreationAttributes<Friends>
> {
  @Attribute(DataTypes.INTEGER)
  @Comment("user id that as sent the request")
  declare requesterId: number;

  @Attribute(DataTypes.INTEGER)
  @Comment("user that as got the request")
  declare addresseeId: number;

  @Attribute(DataTypes.STRING)
  @Comment("status of the request")
  declare status: status;
}
