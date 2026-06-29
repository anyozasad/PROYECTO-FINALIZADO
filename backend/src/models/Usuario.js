// Modelo Usuario simple para desarrollo
class Usuario {
  static async create(data) {
    return {
      id: Math.random(),
      ...data
    };
  }

  static async findOne(query) {
    return null;
  }

  static async findByIdAndUpdate(id, data, options) {
    return { id, ...data };
  }

  static async findById(id) {
    return { id };
  }
}

module.exports = Usuario;
