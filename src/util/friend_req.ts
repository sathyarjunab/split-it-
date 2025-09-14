import { User } from "./../model/user";
import { Friends, status } from "./../model/Friends";
import { Response } from "express";

export const resolveRequest = async (
  existingRelationBetweenUsers: Friends[],
  requestor: User,
  addressee: User
): Promise<void> => {
  if (
    existingRelationBetweenUsers.filter((r) => r.status == status.ACCEPTED)
      .length > 0
  ) {
    throw new Error("you are already friends");
  }

  const requestorPreviousConnection = existingRelationBetweenUsers.filter(
    (r) => r.requesterId == requestor.id
  );

  //this handels the case's where the same user is trying to send the req twice
  if (requestorPreviousConnection.length > 0) {
    switch (requestorPreviousConnection[0].status) {
      case status.PENDING: {
        throw new Error("you have already sent a friend request");
      }
      case status.DECLINED: {
        requestorPreviousConnection[0].status = status.PENDING;
        await requestorPreviousConnection[0].save();
        return;
      }
    }
  } else {
    const newRequest = await Friends.create({
      requesterId: requestor.id,
      addresseeId: addressee.id,
      status: status.PENDING,
    });
    return;
  }
};
