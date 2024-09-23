"use server";

import { signIn, signOut } from "@/lib/auth";

import { CredentialsSignin } from "next-auth";
import { userDetail } from "./userDetail/userDetail.db";
import _ from "lodash";
import moment from "moment";
import sendMailer from "@/lib/node.mailer";
import { createUser } from "./register/register.db";
import { paginationListUser } from "./listUser/listUser.db";
import { date } from "zod";
import { addRole, deleteRole, listRole } from "./listUser/listRole.db";
import { disableUser, searchUser, updateUser } from "./listUser/crudUser.db";
import {
  addProduct,
  batchUploadProduct,
  downloadProduct,
  listUnit,
  searchProduct,
} from "./product/crudProduct.db";
import { paginationListProduct } from "./product/listProduct.db";
import {
  addCampaign,
  Campaigns,
  currentProduct,
  deleteCampaign,
  disableCampaign,
  listCampaignActive,
  listProduct,
  searchCampaign,
  updateCampaign,
} from "./campaign/crudCampaign.db";
import { paginationListCampaign } from "./campaign/listCampaign.db";
import { createServerAction, ServerActionError } from "@/lib/action-utils";

//region action login
const login = createServerAction(
  async ({ email, password }: { email: any; password: any }) => {
    try {
      const auth = await signIn("credentials", {
        redirect: false,
        redirectTo: "/",
        email,
        password,
      });

      return auth;
    } catch (error) {
      const someError = error as CredentialsSignin;

      const cause = someError.cause as unknown as { err: string };
      throw new ServerActionError(cause?.err);
    }
  }
);
//endregion

//region action login
const logout = createServerAction(async () => {
  await signOut({ redirect: true, redirectTo: "/" });
});
//endregion

//region list USer
const userRoles = createServerAction(async ({ id }: { id: string }) => {
  try {
    const detail = await userDetail({ id });

    return _.map(detail?.role, (o) => ({ role: o.id }));
  } catch (error: any) {
    throw new ServerActionError(error.message);
  }
});

const createInternalUser = createServerAction(
  async ({
    email,
    phone,
    dateofbirth,
    leader,
    fullname,
    createdBy,
  }: {
    email?: string;
    phone?: string;
    dateofbirth?: string;
    leader?: string;
    fullname?: string;
    createdBy?: string;
  }) => {
    try {
      const start = moment(`2000-01-01`);
      const end = moment(`${moment().year()}-12-31`);

      const randomDate = moment(start).add(
        Math.random() * end.diff(start),
        "milliseconds"
      );

      if (email) {
        try {
          const created = await createUser({
            password: moment(randomDate).format("DDMMMMYYYY"),
            fullname: fullname ?? "",
            email: email ?? "",
            phone: phone ?? "",
            dateofbirth: dateofbirth ?? "",
            leader,
            createdBy,
          });

          if (created) {
            await sendMailer({
              send: email,
              subject: `${fullname} akun berhasil dibuat.`,
              html: `<html>
                <span>berhasil ${moment(randomDate).format("DDMMMMYYYY")}</span>
              </html>`,
            });
          } else {
            throw new ServerActionError("Try again later.");
          }
        } catch (error: any) {
          throw new ServerActionError(error.message);
        }
      }
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

const paginationUser = createServerAction(
  async ({ take, skip }: { take: number; skip: number }) => {
    try {
      const data = await paginationListUser({ take, skip });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

const roleUser = createServerAction(async () => {
  try {
    const data = await listRole();

    return data;
  } catch (error: any) {
    throw new ServerActionError(error.message);
  }
});

const addRoles = createServerAction(
  async ({
    id,
    idRole,
    idEdit,
  }: {
    id: string;
    idRole: string;
    idEdit: string;
  }) => {
    try {
      const data = await addRole({ id, idRole, idEdit });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

const deleteRoles = createServerAction(
  async ({ id, idRole }: { id: string; idRole: string }) => {
    try {
      const data = await deleteRole({ id, idRole });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

const searchUsers = createServerAction(
  async ({ searchText }: { searchText: string }) => {
    try {
      const data = await searchUser({ findSearch: searchText });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

const disableUsers = createServerAction(
  async ({
    updatedBy,
    disable,
    idEdit,
  }: {
    idEdit?: string;
    updatedBy?: string;
    disable?: boolean;
  }) => {
    try {
      const data = await disableUser({ updatedBy, idEdit, disable });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

const updateUsers = createServerAction(
  async ({
    updatedBy,
    idEdit,
    fullname,
    phone,
    email,
    bod,
    leader,
  }: {
    idEdit?: string;
    updatedBy?: string;
    fullname?: string;
    phone?: string;
    email?: string;
    bod?: string;
    leader?: string;
  }) => {
    try {
      const data = await updateUser({
        updatedBy,
        fullname,
        phone,
        email,
        bod,
        leader,
        idEdit,
      });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

export {
  login,
  logout,
  userRoles,
  createInternalUser,
  paginationUser,
  roleUser,
  addRoles,
  deleteRoles,
  updateUsers,
  searchUsers,
  disableUsers,
};
//endregion

//region Product
const listUnits = createServerAction(async () => {
  try {
    const data = await listUnit();

    return _.map(data, (o) => ({ value: o.name, label: o.name }));
  } catch (error: any) {
    throw new ServerActionError(error.message);
  }
});

const addProducts = createServerAction(
  async ({
    productCode,
    productName,
    weight,
    basePoint,
    unit,
    expiredPeriod,
    createdBy,
  }: {
    productName: string;
    productCode: string;
    weight: number;
    basePoint: number;
    unit: string;
    expiredPeriod: number;
    createdBy: string;
  }) => {
    try {
      const data = await addProduct({
        productCode,
        productName,
        weight,
        basePoint,
        unit,
        expiredPeriod,
        createdBy,
      });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

const paginationProduct = createServerAction(
  async ({ take, skip }: { take: number; skip: number }) => {
    try {
      const data = await paginationListProduct({ take, skip });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

const downloadProducts = createServerAction(async () => {
  try {
    const data = await downloadProduct();

    return data;
  } catch (error: any) {
    throw new ServerActionError(error.message);
  }
});

const uploadProduct = createServerAction(async ({ data }: { data: any }) => {
  try {
    const productUpload = await batchUploadProduct({ data });

    return productUpload;
  } catch (error: any) {
    throw new ServerActionError(error.message);
  }
});

const searchProducts = createServerAction(
  async ({ searchText }: { searchText: string }) => {
    try {
      const data = await searchProduct({ findSearch: searchText });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

export {
  listUnits,
  addProducts,
  paginationProduct,
  downloadProducts,
  uploadProduct,
  searchProducts,
};
//endregion

//region Campaign
const listProducts = createServerAction(async () => {
  try {
    const data = await listProduct();

    return _.map(data, (o) => ({
      value: o.productId,
      label: `${o.productCode} - ${o.productName}`,
    }));
  } catch (error: any) {
    throw new ServerActionError(error.message);
  }
});

const currentProducts = createServerAction(
  async ({ campaignId }: { campaignId: string }) => {
    try {
      const data = await currentProduct({ campaignId });

      const finalData = _.map(data, (o) => ({
        value: o.productId,
        label: `${o.productCode} - ${o.productName}`,
      }));

      return finalData;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

const addCampaigns = createServerAction(
  async ({
    campaignName,
    startDate,
    endDate,
    productId,
    loyaltyPoint,
    image,
    description,
    createdBy,
  }: {
    campaignName: string;
    startDate: string;
    endDate: string;
    productId: string[];
    loyaltyPoint: number;
    image: any;
    description: string;
    createdBy: string;
  }) => {
    try {
      const data = await addCampaign({
        campaignName,
        startDate,
        endDate,
        description,
        productId,
        loyaltyPoint,
        createdBy,
        image: Buffer.from(image, "base64"),
      });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

const updateCampaigns = createServerAction(
  async ({
    campaignName,
    productId,
    oldProductId,
    startDate,
    endDate,
    image,
    loyaltyPoint,
    description,
    campaignId,
    updatedBy,
  }: Campaigns) => {
    try {
      const data = await updateCampaign({
        campaignName,
        productId,
        oldProductId,
        startDate,
        endDate,
        image: image ? Buffer.from(image, "base64") : undefined,
        loyaltyPoint,
        description,
        campaignId,
        updatedBy,
      });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

const listCampaignActives = createServerAction(async () => {
  try {
    const data = await listCampaignActive();

    return data;
  } catch (error: any) {
    throw new ServerActionError(error.message);
  }
});

const paginationCampaign = createServerAction(
  async ({ take, skip }: { take: number; skip: number }) => {
    try {
      const data = await paginationListCampaign({ take, skip });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

const searchCampaigns = createServerAction(
  async ({ searchText }: { searchText: string }) => {
    try {
      const data = await searchCampaign({ findSearch: searchText });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

const disableCampaigns = createServerAction(
  async ({
    updatedBy,
    disable,
    idEdit,
  }: {
    idEdit?: string;
    updatedBy?: string;
    disable?: boolean;
  }) => {
    try {
      const data = await disableCampaign({ updatedBy, idEdit, disable });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

const deleteCampaigns = createServerAction(
  async ({ idEdit }: { idEdit?: string }) => {
    try {
      const data = await deleteCampaign({ idEdit });

      return data;
    } catch (error: any) {
      throw new ServerActionError(error.message);
    }
  }
);

export {
  listProducts,
  addCampaigns,
  paginationCampaign,
  searchCampaigns,
  disableCampaigns,
  currentProducts,
  updateCampaigns,
  deleteCampaigns,
  listCampaignActives,
};
//endregion
