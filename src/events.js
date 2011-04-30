(function(oCanvas, window, document, undefined){

	// Define the class
	var events = function () {
		
		// Return an object when instantiated
		return {
			
			types: {},
			pointers: {},
			
			init: function () {
			
				// Add properties that the this module needs to be able to add events directly to the canvas
				this.core.canvasElement.events = {};
				this.core.canvasElement.drawn = true;
				this.core.canvasElement.isPointerInside = function () { return true; };
			},

			// Method for binding an event to a specific object
			bind: function (obj, types, handler) {
				var core = this.core,
					length, wrapper, index,
					types = types.split(" "),
					t, type,
					p;
				
				for (t = 0; t < types.length; t++) {
				
					type = types[t];
					
					// Handle keyboard events
					if (this.types.keyboard && ~this.types.keyboard.indexOf(type)) {
						
						// Add the event
						index = this.core.keyboard.addEvent(type, handler);
						
						// Initialize the events object for specific event type
						if (obj.events[type] === undefined) {
							obj.events[type] = {};
						}
						
						// Add the handler to the object
						obj.events[type][index] = handler;
					}
					
					// Handle pointer events
					else {
						
						for (p in this.pointers) {
							this.pointers[p](type, (function(type) {
								return function (pointer, clickName) {
									
									// Initialize the events object for specific event type
									if (obj.events[type] === undefined) {
										obj.events[type] = {};
									}
									
									// Create event wrapper
									wrapper = function (e, forceLeave) {
									
										// Cancel event if object is not drawn to canvas
										if (!obj.drawn) {
											return;
										}
									
										// If pointer is inside the object and we are not forced to trigger mouseleave
										if (obj.isPointerInside() && !forceLeave) {
										
											// Only trigger mouse events that are supposed to be triggered inside the object
											if (type !== pointer + "leave") {
											
												// Only trigger mouseenter the first time event is triggered after pointer enters the object
												if (type === pointer + "enter" && obj.events[pointer + "ontarget"]) {
													return;
												}
												
												// Don't trigger click events if the pointer was pressed down outside the object
												if (type === clickName && (core.pointer.start_pos.x < 0 || core.pointer.start_pos.y < 0 || !obj.isPointerInside(core.pointer.start_pos))) {
													return;
												}
												
												// Don't trigger drag events if there is another object in the same position
												// on a higher layer.
												// Assume that the objects array has already been sorted in ascending 
												// layer order
												if (type === "mousedown") {
													for (idx = obj.id + 1; idx < core.draw.lastObjectID; ++idx) {
														if (core.draw.objects[idx].isPointerInside(core.pointer.start_pos)) {
															return;
														}
													}
												}
												
												// Set status and trigger callback
												if (type !== "touchend") {
													obj.events[pointer + "ontarget"] = true;
												}
												handler.call((obj.nodeName !== undefined ? core : obj), e);
											}
										}
										
										// If pointer is not inside the object right now, but just was
										else if (type === pointer + "leave" && obj.events[pointer + "ontarget"]) {
										
											// Reset status and trigger callback for mouseleave
											obj.events[pointer + "ontarget"] = false;
											handler.call(obj, e);
										}
									};
									
									// Add the handler to the event list in the mouse module
									index = core[pointer].addEvent(type, wrapper);
									obj.events[type][index] = handler;
								};
							})(type));
						}
					}
				}
			},
			
			// Method for removing an event handler from an object
			unbind: function (obj, types, handler) {
				var t, type, x, pointer, i, index;
				
				types = types.split(" ");
				
				for (t = 0; t < types.length; t++) {
				
					type = types[t];
					
					// Ignore event type if the object doesn't have any events of that type
					if (obj.events[type] === undefined) {
						continue;
					}
					
					// Find pointer type
					for (x in this.types) {
						if (~this.types[x].indexOf(type)) {
							pointer = x;
							break;
						}
					}
					
					// Find the index for the specified handler
					for (i in obj.events[type]) {
						if (obj.events[type][i] === handler) {
							index = i;
						}
					}
					
					// If index was found, remove the handler
					if (index !== undefined) {
						delete obj.events[type][index];
						this.core[pointer].removeEvent(type, index);
					}
				}
			},
			
			
			// Method for triggering events that has been added to an object
			trigger: function (obj, types) {
				var t, type, event, events;
				
				types = types.split(" ");
				
				// Loop through the specified event types
				for (t = 0; t < types.length; t++) {
					type = types[t];
					events = obj.events[type];
					
					// If the event type exists on the object
					if (events !== undefined) {
						
						// Trigger all events of this type on this object
						for (event in events) {
							if (~this.types.keyboard.indexOf(type)) {
								events[event].call(obj, this.core.keyboard.last_event);
							} else {
								events[event].call(obj, this.core.pointer.last_event);
							}
						}
					}
					
					// If the event type is a cancel event
					else if (~type.indexOf("cancel")) {
						this.core[type.replace("cancel","")].cancel();
					}
				}
			},
			
			// Method for modifying the event object and fixing a few issues
			modifyEventObject: function (event, type) {
				var properties = "altKey ctrlKey metaKey shiftKey button charCode keyCode clientX clientY layerX layerY pageX pageY screenX screenY detail eventPhase isChar touches targetTouches changedTouches scale rotation".split(" "),
					numProps = properties.length,
					eventObject, i, property;
				
				// Fix specific properties and methods
				eventObject = {
					originalEvent: event,
					type: type,
					timeStamp: (new Date()).getTime(),
					which: event.which === 0 ? event.keyCode : event.which,
					
					preventDefault: function () {
						event.preventDefault();
					},
					
					stopPropagation: function () {
						event.stopPropagation();
					}
				};
				
				// Set selected original properties
				for (i = 0; i < numProps; i++) {
					property = properties[i];
					if (event[property] !== undefined) {
						eventObject[property] = event[property];
					}
				}
				
				// Fix original methods
				eventObject.preventDefault
				
				return eventObject;
			}
		};
	};

	// Register the module
	oCanvas.registerModule("events", events, "init");

})(oCanvas, window, document);
