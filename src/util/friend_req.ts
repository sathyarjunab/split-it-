import { User } from "./../model/user";
import { Friends, status } from "./../model/Friends";
import { Response } from "express";

export const resolveRequest = async (
  existingRelationBetweenUsers: Friends[],
  requestor: User,
  addressee: User
): Promise<void> => {
  if (existingRelationBetweenUsers.some((r) => r.status == status.ACCEPTED)) {
    throw new Error("you are already friends");
  }

  const requestorPreviousConnection = existingRelationBetweenUsers.find(
    (r) => r.requesterId == requestor.id
  );

  //this handles the case's where the same user is trying to send the req twice
  if (requestorPreviousConnection) {
    switch (requestorPreviousConnection.status) {
      case status.PENDING:
        throw new Error("you have already sent a friend request");
      case status.DECLINED:
        requestorPreviousConnection.status = status.PENDING;
        await requestorPreviousConnection.save();
        return;
    }
  }

  //this handles the case where the other user as sent the req and you are sending him the req again
  await Friends.create({
    requesterId: requestor.id,
    addresseeId: addressee.id,
    status: status.PENDING,
  });
};
