const { ObjectId } = require('mongodb');  // Import ObjectId from the 'mongodb' package

const mongoose = require("mongoose");

const addServiceView = (req, res) => {
  const user_id = req.params.user_id;
  const template_id = req.params.template_id;
  const success_msg = req.flash("success");

  res.render("service/add_service", { user_id, template_id, success_msg });
};


const createService = async (req, res) => {
  let service_name = req.body["service_name"];
  let service_description = req.body["service_description"];
  let service_price = req.body["service_price"];
  let service_days = req.body["service_days"];
  let service_times = req.body["service_times"];
  // console.log("service date : ", service_days);
  // console.log("service date : ", service_times);

  let service_days_pre = service_days;
  let service_times_pre = service_times;

  const last_day_arr = JSON.parse(service_days).map((outerArray) => {
    return outerArray.filter((innerArray) => {
      return innerArray.some((element) => element !== null);
    });
  });


  // console.log(service_days);
  // console.log(service_days_pre);

  const last_time_arr = JSON.parse(service_times).map((outerArray) => {
    return outerArray.filter((innerArray) => {
      return innerArray.some((element) => element !== null);
    });
  });
  // console.log(last_day_arr);
  let service_category = req.body["service_category"];
  const { user_id, template_id } = req.params;

  const service_table = `services_of_user_${user_id}_template_${template_id}`;
  const category_table = `services_category_of_user_${user_id}_template_${template_id}`;

  const collection1 = mongoose.connection.collection(service_table);
  const cate_collection = mongoose.connection.collection(category_table);

  for (let i = 0; i < service_name.length; i++) {
    const primaryImage = req.files.filter(
      (file) => file.fieldname === `primary_image[${i}]`
    );
    const secondaryImages = req.files.filter(
      (file) => file.fieldname === `secondary_images[${i}]`
    );
    let primaryImagePath;

    if (primaryImage) {
      primaryImagePath = primaryImage.map((image) =>
        image.path.replace(/\\/g, "/").replace("public", "")
      );
    }
    let secondaryImagePaths;
    if (secondaryImages) {
      secondaryImagePaths = secondaryImages.map((image) =>
        image.path.replace(/\\/g, "/").replace("public", "")
      );
    }

    const existingCategory = await cate_collection.findOne({
      name: service_category[i],
      template_id: template_id,
      user_id: user_id,
    });
    let serviceCategoryId;
    if (existingCategory != null) {
      console.log("existing service category present");
      serviceCategoryId = existingCategory._id;
    } else {
      const cate_data = {
        name: service_category[i],
        user_id: user_id,
        template_id: template_id,
        created_at: new Date(),
        updated_at: new Date(),
      };
      let category_n = await cate_collection.insertOne(cate_data);
      serviceCategoryId = category_n.insertedId;
    }
    let data = {
      user_id: user_id,
      template_id: template_id,
      primary_image: primaryImagePath,
      secondary_images: secondaryImagePaths ? secondaryImagePaths : [],
      name: service_name[i],
      price: service_price[i],
      description: service_description[i],
      service_days: last_day_arr[i],
      service_times: last_time_arr[i],
      service_category_id: serviceCategoryId,
      service_days_pre: service_days_pre,
      service_times_pre: service_times_pre
    };
    const service = await collection1.insertOne(data);
  }
  req.flash("success", "successfully saved the Service to the database");
  res.redirect(`/service/${user_id}/${template_id}`);
};
const serviceListView = async (req, res) => {
  const user_id = req.params.user_id;
  const template_id = req.params.template_id;
  const service_table = `services_of_user_${user_id}_template_${template_id}`;
  const collection1 = mongoose.connection.collection(service_table);
  let services = await collection1.find({});
  services = await services.toArray();
  console.log(services);
  res.render("service/service_list", {
    user_id: user_id,
    template_id: template_id,
    services: services ? services : [],
  });
};
const appointmentListView = (req, res) => {
  const user_id = req.params.user_id;
  const template_id = req.params.template_id;
  res.render("service/appointment_list", {
    user_id: user_id,
    template_id: template_id,
  });
};
const getAllServicesByCategory = async (req, res) => {
  let { user_id, template_id } = req.params;
  const service_table = `services_of_user_${user_id}_template_${template_id}`;
  const category_table = `services_category_of_user_${user_id}_template_${template_id}`;
  console.log(category_table);
  const collection1 = mongoose.connection.collection(service_table);
  const cate_collection = mongoose.connection.collection(category_table);
  let categories_with_services = await cate_collection.aggregate([
    {
      $lookup: {
        from: service_table,
        localField: "_id", // The field from the "categories" collection
        foreignField: "service_category_id", // The field from the "services" collection
        as: "services",
      },
    },
  ]);
  categories_with_services = await categories_with_services.toArray();
  res.send({ service_categories_with_service: categories_with_services });
};


const edit_service_list = async (req, res) => {
  let { user_id, template_id, service_id } = req.params;

  const service_table = `services_of_user_${user_id}_template_${template_id}`;
  const category_table = `services_category_of_user_${user_id}_template_${template_id}`;

  const service_collection = mongoose.connection.collection(service_table);
  const cate_collection = mongoose.connection.collection(category_table);

  let service = await service_collection.findOne({ user_id: user_id, template_id: template_id, _id: new ObjectId(service_id) });

  let cate_gory = await cate_collection.find({});
  categories = await cate_gory.toArray();

  // console.log(service.service_days);
  // console.log(service.service_times);

  res.render("service/edit_service_list", { user_id, template_id, categories, service });
}

const postEditService = async (req, res) => {

  let { user_id, template_id, service_id } = req.params;
  const { service_name, service_description, service_price, service_times, service_days, service_category } = req.body;




  const last_day_arr = JSON.parse(service_days).map((outerArray) => {
    return outerArray.filter((innerArray) => {
      return innerArray.some((element) => element !== null);
    });
  });


  // console.log(last_day_arr);

  const last_time_arr = JSON.parse(service_times).map((outerArray1) => {
    return outerArray1.filter((innerArray1) => {
      return innerArray1.some((element1) => element1 !== null);
    });
  });

  const primaryImage = req.files.filter((file) =>
    file.fieldname === 'primary_image'
  );

  const secondaryImages = req.files.filter(
    (file) => file.fieldname === `secondary_images`
  );

  let primaryImagePath;
  if (primaryImage) {
    primaryImagePath = primaryImage.map((image) =>
      image.path.replace(/\\/g, "/").replace("public", "")
    );
  }
  // console.log('type ', typeof (primaryImagePath));

  let secondaryImagePaths;
  if (secondaryImages) {
    secondaryImagePaths = secondaryImages.map((image) =>
      image.path.replace(/\\/g, "/").replace("public", "")
    );
  }


  // console.log(primaryImagePath);
  // console.log(secondaryImagePaths);

  // console.log('start');
  // console.log(service_name);
  // console.log(service_description);
  // console.log(service_price);

  // console.log('before');
  // console.log(service_days);

  // console.log('after');

  // console.log(last_day_arr);
  // console.log(last_time_arr);

  const service_table = `services_of_user_${user_id}_template_${template_id}`

  const service_collection = mongoose.connection.collection(service_table);

  let setData = {
    name: service_name,
    price: service_price,
    description: service_description,
    ...(JSON.stringify(primaryImagePath) !== '[]' && { primary_image: primaryImagePath }),
    ...(JSON.stringify(secondaryImagePaths) !== '[]' && { secondary_images: secondaryImagePaths }),
    service_days: last_day_arr[0],
    service_times: last_time_arr[0],
    service_days_pre: service_days,
    service_times_pre: service_times,
    service_category_id: service_category,
  };
  // console.log(setData);
  try {

    const update = await service_collection.updateOne(
      {
        _id: new ObjectId(service_id)
      },
      {
        $set: setData
      }
    );
    // console.log(update);
    res.redirect(`../service_list`);
  }

  catch (err) {
    console.log(err);

  }

}


const deleteService = async (req, res) => {
  console.log('delete');
  const { user_id, template_id, service_id } = req.params;


  const serviceObjectId = new ObjectId(service_id);


  let service_collection = `services_of_user_${user_id}_template_${template_id}`;
  const service_table = mongoose.connection.collection(service_collection);

  let delete_one_record_from_serviceTable = await service_table.deleteOne({ _id: serviceObjectId });

  try {

    if (delete_one_record_from_serviceTable.deletedCount === 1) {
      console.log('Successfully delete the record');
      res.redirect(`../service_list`);

    }
    else {
      console.log('Not Deleted');

    }
  }

  catch (err) {
    console.log(err);

  }
}

module.exports = {
  addServiceView,
  serviceListView,
  appointmentListView,
  createService,
  getAllServicesByCategory,
  edit_service_list,
  postEditService,
  deleteService,
};

