/*
 * Copyright 2020 Google LLC.
 *
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 *
 * Code distributed by Google as part of this project is also subject to an additional IP rights
 * grant found at
 * http://polymer.github.io/PATENTS.txt
 */

package arcs.android.e2e.simpleapp

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.RadioButton
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import arcs.android.host.AndroidManifestHostRegistry
import arcs.core.allocator.Allocator
import arcs.core.common.ArcId
import arcs.core.data.HandleMode
import arcs.core.entity.HandleContainerType
import arcs.core.entity.HandleSpec
import arcs.core.host.EntityHandleManager
import arcs.core.storage.keys.RamDiskStorageKey
import arcs.core.storage.referencemode.ReferenceModeStorageKey
import arcs.core.util.Scheduler
import arcs.jvm.util.JvmTime
import arcs.sdk.ReadWriteCollectionHandle
import arcs.sdk.ReadWriteSingletonHandle
import arcs.sdk.android.storage.ServiceStoreFactory
import kotlin.coroutines.CoroutineContext
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.asCoroutineDispatcher
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.util.concurrent.Executors

/** Entry UI to launch Arcs Test. */
class TestActivity : AppCompatActivity() {

    private lateinit var resultView1: TextView

    private var result1 = ""
    private var result2 = ""

    private val coroutineContext: CoroutineContext = Job() + Dispatchers.Main
    private val scope: CoroutineScope = CoroutineScope(coroutineContext)
    //private var storageMode = TestEntity.StorageMode.IN_MEMORY
    private var isCollection = false
    private var setFromRemoteService = false
    private var singletonHandle: ReadWriteSingletonHandle<WritePerson_Person>? = null
    //private var collectionHandle: ReadWriteCollectionHandle<TestEntity>? = null

    private var allocator: Allocator? = null
    private var resurrectionArcId: ArcId? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContentView(R.layout.test_activity)
        resultView1 = findViewById<Button>(R.id.result1)
        resultView1.text = "Hello, world"
        scope.launch { testReadWriteArc() }
//        scope.launch {
//            fetchAndAppend()
//        }

    }

    //private suspend fun fetchAndAppend() {
    //    createHandle()
    //    resultView1.text = "SingletonHandle: ${singletonHandle?.fetch()}"
    //}

    private suspend fun createHandle() {
        val handleManager = EntityHandleManager(
            time = JvmTime,
            scheduler = Scheduler(
                JvmTime,
                coroutineContext
                    + Executors.newSingleThreadExecutor().asCoroutineDispatcher()
            ),
            activationFactory = ServiceStoreFactory(
                this,
                lifecycle
            )
        )
        singletonHandle = handleManager.createHandle(
            HandleSpec(
                "singletonHandle",
                HandleMode.ReadWrite,
                HandleContainerType.Singleton,
                WritePerson_Person
            ),
            ReferenceModeStorageKey(
                backingKey = RamDiskStorageKey("singleton_reference"),
                storageKey = RamDiskStorageKey("singleton")
            )
        ) as ReadWriteSingletonHandle<WritePerson_Person>
    }

    private suspend fun testReadWriteArc() {
        allocator = Allocator.create(
            AndroidManifestHostRegistry.create(this@TestActivity),
            EntityHandleManager(
                time = JvmTime,
                scheduler = Scheduler(
                    JvmTime,
                    coroutineContext
                        + Executors.newSingleThreadExecutor().asCoroutineDispatcher()
                ),
                activationFactory = ServiceStoreFactory(
                    context = this@TestActivity,
                    lifecycle = this@TestActivity.lifecycle
                )
            )
        )
        val arcId = allocator?.startArcForPlan("Person", PersonRecipePlan)
        createHandle()
        resultView1.text = "SingletonHandle: ${singletonHandle?.fetch()}"
        arcId?.let { allocator?.stopArc(it) }
    }

    companion object {
        const val RESULT_NAME = "result"
    }
}
