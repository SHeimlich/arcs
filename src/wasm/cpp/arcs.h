#ifndef _ARCS_H
#define _ARCS_H

#include <emscripten.h>
#include <string>
#include <vector>
#include <unordered_map>
#include <unordered_set>
#include <memory>

namespace arcs {

using URL = std::string;
using Dictionary = std::unordered_map<std::string, std::string>;

class Handle;
class Particle;

namespace internal {
extern "C" {

// --- Wasm-to-JS API ---

// singletonSet and collectionStore will create ids for entities if required, and will return
// the new ids in allocated memory that the Handle implementations will free.
extern const char* singletonSet(Particle* p, Handle* h, const char* encoded);
extern void singletonClear(Particle* p, Handle* h);
extern const char* collectionStore(Particle* p, Handle* h, const char* encoded);
extern void collectionRemove(Particle* p, Handle* h, const char* encoded);
extern void collectionClear(Particle* p, Handle* h);
extern void render(Particle* p, const char* slotName, const char* template_str, const char* model);
extern void serviceRequest(Particle* p, const char* call, const char* args, const char* tag);

// Returns allocated memory that the Particle base class will free.
extern const char* resolveUrl(const char* url);

// Logging and error handling
extern void setLogInfo(const char* file, int line);
extern void systemError(const char* msg);

}  // extern "C"

// --- Packaging classes ---
// Used by the code generated from Schema definitions to pack and unpack serialized data.

class StringDecoder {
public:
  StringDecoder(const char* str) : str_(str) {}

  StringDecoder(StringDecoder&) = delete;
  StringDecoder(const StringDecoder&) = delete;
  StringDecoder& operator=(StringDecoder&) = delete;
  StringDecoder& operator=(const StringDecoder&) = delete;

  bool done() const;
  std::string upTo(char sep);
  int getInt(char sep);
  std::string chomp(int len);
  void validate(std::string token);
  template<typename T> void decode(T& val);

  static void decodeList(const char* str, std::function<void(const std::string&)> callback);
  static Dictionary decodeDictionary(const char* str);

private:
  const char* str_;
};

class StringEncoder {
public:
  StringEncoder() = default;

  StringEncoder(StringEncoder&) = delete;
  StringEncoder(const StringEncoder&) = delete;
  StringEncoder& operator=(StringEncoder&) = delete;
  StringEncoder& operator=(const StringEncoder&) = delete;

  template<typename T> void encode(const char* prefix, const T& val);
  std::string result();

  static std::string encodeDictionary(const Dictionary& dict);

private:
  std::string str_;
};

// Used by generated entity_to_str() instances for general purpose display/logging.
class StringPrinter {
public:
  StringPrinter() = default;

  StringPrinter(StringPrinter&) = delete;
  StringPrinter(const StringPrinter&) = delete;
  StringPrinter& operator=(StringPrinter&) = delete;
  StringPrinter& operator=(const StringPrinter&) = delete;

  void addId(const std::string& id);
  template<typename T> void add(const char* prefix, const T& val);
  std::string result(const char* join);

private:
  std::vector<std::string> parts_;
};

// Serialization methods for transporting data across the wasm boundary.
// Schema-specific implementations will be generated for these.
template<typename T>
void decode_entity(T* entity, const char* str) {
  static_assert(sizeof(T) == 0, "Only schema-specific implementations of decode_entity can be used");
}

template<typename T>
std::string encode_entity(const T& entity) {
  static_assert(sizeof(T) == 0, "Only schema-specific implementations of encode_entity can be used");
}

}  // namespace internal


// --- Logging ---
// console() and error() use printf-style formatting. File and line info is added automatically.

#define console(...) do {                           \
    arcs::internal::setLogInfo(__FILE__, __LINE__); \
    printf(__VA_ARGS__);                            \
  } while (0)

#define error(...) do {                             \
    arcs::internal::setLogInfo(__FILE__, __LINE__); \
    fprintf(stderr, __VA_ARGS__);                   \
  } while (0)


// --- Entity helpers ---
// Schema-specific implementations will be generated for the following:

// Copies the schema-based data fields; does not copy the internal id.
template<typename T>
T clone_entity(const T& entity) {
  static_assert(sizeof(T) == 0, "Only schema-specific implementations of clone_entity can be used");
}

// Returns whether two entities have the same data fields set (does not compare internal ids).
template<typename T>
bool entities_equal(const T& a, const T& b) {
  static_assert(sizeof(T) == 0, "Only schema-specific implementations of entities_equal can be used");
}

// Converts an entity to a string. Unset fields are omitted.
template<typename T>
std::string entity_to_str(const T& entity, const char* join = ", ") {
  static_assert(sizeof(T) == 0, "Only schema-specific implementations of entity_to_str can be used");
}

// Strips trailing zeros, and the decimal point for integer values.
std::string num_to_str(double num);


// --- Storage classes ---

enum Direction { Unconnected, In, Out, InOut };

class Handle {
public:
  virtual ~Handle() {}

  // These are called by the runtime and should not be used directly by Particle implementations.
  virtual void sync(const char* model) = 0;
  virtual void update(const char* encoded1, const char* encoded2) = 0;

  const std::string& name() const { return name_; }

protected:
  bool failForDirection(Direction bad_dir) const;

  // These are initialized by the Particle class.
  std::string name_;
  Particle* particle_;
  Direction dir_ = Unconnected;

  friend class Particle;
};

template<typename T>
class Singleton : public Handle {
public:
  void sync(const char* model) override {
    failForDirection(Out);
    entity_ = T();
    internal::decode_entity(&entity_, model);
  }

  void update(const char* model, const char* ignored) override {
    sync(model);
  }

  const T& get() const {
    failForDirection(Out);
    return entity_;
  }

  // For new entities created by a particle, this method will generate a new internal ID and update
  // the given entity with it. The data fields will not be modified.
  void set(T* entity) {
    failForDirection(In);
    std::string encoded = internal::encode_entity(*entity);
    const char* id = internal::singletonSet(particle_, this, encoded.c_str());
    if (id != nullptr) {
      entity->_internal_id_ = id;
      free((void*)id);
    }
    // Write-only handles do not keep entity data locally.
    if (dir_ == InOut) {
      entity_ = *entity;
    }
  }

  void clear() {
    failForDirection(In);
    internal::singletonClear(particle_, this);
    if (dir_ == InOut) {
      entity_ = T();
    }
  }

private:
  T entity_;
};

// Minimal iterator for Collections; allows iterating directly over const T& values.
template<typename T>
class WrappedIter {
  using Iterator = typename std::unordered_map<std::string, std::unique_ptr<T>>::const_iterator;

public:
  WrappedIter(Iterator it) : it_(std::move(it)) {}

  const T& operator*() const { return *it_->second; }
  const T* operator->() const { return it_->second.get(); }

  WrappedIter& operator++() { ++it_; return *this; }
  WrappedIter operator++(int) { return WrappedIter(it_++); }

  friend bool operator==(const WrappedIter& a, const WrappedIter& b) { return a.it_ == b.it_; }
  friend bool operator!=(const WrappedIter& a, const WrappedIter& b) { return a.it_ != b.it_; }

private:
  Iterator it_;
};

template<typename T>
class Collection : public Handle {
  using Map = std::unordered_map<std::string, std::unique_ptr<T>>;

public:
  void sync(const char* model) override {
    entities_.clear();
    add(model);
  }

  void update(const char* added, const char* removed) override {
    add(added);
    internal::StringDecoder::decodeList(removed, [this](const std::string& str) {
      // TODO: just get the id, no need to decode the full entity
      T entity;
      internal::decode_entity(&entity, str.c_str());
      entities_.erase(entity._internal_id_);
    });
  }

  bool empty() const {
    failForDirection(Out);
    return entities_.empty();
  }

  size_t size() const {
    failForDirection(Out);
    return entities_.size();
  }

  WrappedIter<T> begin() const {
    failForDirection(Out);
    return WrappedIter<T>(entities_.cbegin());
  }

  WrappedIter<T> end() const {
    failForDirection(Out);
    return WrappedIter<T>(entities_.cend());
  }

  // For new entities created by a particle, this method will generate a new internal ID and update
  // the given entity with it. The data fields will not be modified.
  void store(T* entity) {
    failForDirection(In);
    std::string encoded = internal::encode_entity(*entity);
    const char* id = internal::collectionStore(particle_, this, encoded.c_str());
    if (id != nullptr) {
      entity->_internal_id_ = id;
      free((void*)id);
    }
    // Write-only handles do not keep entity data locally.
    if (dir_ == InOut) {
      entities_.emplace(entity->_internal_id_, new T(*entity));
    }
  }

  void remove(const T& entity) {
    failForDirection(In);
    std::string encoded = internal::encode_entity(entity);
    internal::collectionRemove(particle_, this, encoded.c_str());
    if (dir_ == InOut) {
      entities_.erase(entity._internal_id_);
    }
  }

  void clear() {
    failForDirection(In);
    internal::collectionClear(particle_, this);
    if (dir_ == InOut) {
      entities_.clear();
    }
  }

private:
  void add(const char* added) {
    failForDirection(Out);
    internal::StringDecoder::decodeList(added, [this](const std::string& str) {
      std::unique_ptr<T> eptr(new T());
      internal::decode_entity(eptr.get(), str.c_str());
      entities_.erase(eptr->_internal_id_);  // emplace doesn't overwrite
      entities_.emplace(eptr->_internal_id_, std::move(eptr));
    });
  }

  Map entities_;
};


// --- Particle base class ---
// TODO: port sync tracking and auto-render to the JS particle.

class Particle {
public:
  virtual ~Particle() {}

  // -- Setup --

  // Called by sub-class constructors to map names to their handle fields.
  void registerHandle(std::string name, Handle& handle);

  // Optionally called by sub-class constructors to indicate that we should automatically call
  // renderSlot() with the given slot name once all handles are synced, and whenever one is updated.
  void autoRender(const std::string& slot_name = "root");

  // Called once a particle has been set up. Initial processing and service requests may be
  // executed here. Readable handles are *not* guaranteed to be synchronized at this point.
  // Write-only handles may safely be accessed.
  virtual void init() {}

  // -- Storage --

  // Override to provide specific handling of handle sync/updates.
  virtual void onHandleSync(const std::string& name, bool all_synced) {}
  virtual void onHandleUpdate(const std::string& name) {}

  // Retrieve a handle by name; e.g. auto h = getSingleton<arcs::SomeEntityType>(name)
  template<typename T>
  Singleton<T>* getSingleton(const std::string& name) const {
    auto it = handles_.find(name);
    return (it != handles_.end()) ? dynamic_cast<Singleton<T>*>(it->second) : nullptr;
  }

  template<typename T>
  Collection<T>* getCollection(const std::string& name) const {
    auto it = handles_.find(name);
    return (it != handles_.end()) ? dynamic_cast<Collection<T>*>(it->second) : nullptr;
  }

  // -- Rendering and events --

  // Override to provide a template string and key:value model for rendering into a slot.
  virtual std::string getTemplate(const std::string& slot_name) { return ""; }
  virtual void populateModel(const std::string& slot_name, Dictionary* model) {}

  // Can be called by sub-classes to initiate rendering; also invoked when auto-render is enabled
  // after all handles have been synchronized.
  // TODO: it doesn't make sense to have both send flags false; ignore, error or convert to enum?
  void renderSlot(const std::string& slot_name, bool send_template = true, bool send_model = true);

  // Override to react to UI events triggered by handlers in the template provided below.
  virtual void fireEvent(const std::string& slot_name, const std::string& handler) {}

  // -- Services --

  // Sub-classes may call this to resolve URLs like 'https://$particles/path/to/assets/pic.jpg'.
  // The '$here' prefix can be used to map to the location of the wasm binary file (for example:
  // '$here/path/to/assets/pic.jpg').
  std::string resolveUrl(const std::string& url);

  // Sub-classes can request a service call using this method and the response will be delivered via
  // serviceResponse(). The optional tag argument can be used to disambiguate multiple requests.
  void serviceRequest(const std::string& call, const Dictionary& args, const std::string& tag = "");
  virtual void serviceResponse(
      const std::string& call, const Dictionary& response, const std::string& tag) {}

  // -- Internal API --
  // These are public to allow access from JS, but should not be called by sub-classes.

  // Called by the runtime to associate the inner handle instance with the outer object.
  Handle* connectHandle(const char* name, bool can_read, bool can_write);

  // Called by the runtime to synchronize a handle.
  void sync(Handle* handle);

  // Called by the runtime to update a handle.
  void update(Handle* handle);

private:
  std::unordered_map<std::string, Handle*> handles_;
  std::unordered_set<Handle*> to_sync_;
  std::string auto_render_slot_;
};

// Defines an exported function 'newParticleName()' that the runtime will call to create
// particles inside the wasm container.
#define DEFINE_PARTICLE(name)     \
  extern "C" {                    \
    EMSCRIPTEN_KEEPALIVE          \
    arcs::Particle* new##name() { \
      return new name();          \
    }                             \
  }

}  // namespace arcs

#endif
